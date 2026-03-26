const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// --- Key Derivation ---
function deriveKey(password, salt) {
    return crypto.scryptSync(password, salt, KEY_LENGTH);
}

// --- Encrypt a single file ---
function encryptFile(filePath, password) {
    const plaintext = fs.readFileSync(filePath);

    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Write: salt + iv + authTag + encryptedData
    const output = Buffer.concat([salt, iv, authTag, encrypted]);
    fs.writeFileSync(filePath + '.enc', output);

    console.log(`✔ Encrypted: ${filePath}`);
}

// --- Decrypt a single file ---
function decryptFile(filePath, password) {
    try {
        const data = fs.readFileSync(filePath);

        const salt = data.subarray(0, SALT_LENGTH);
        const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

        const key = deriveKey(password, salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        // Remove the .enc extension for the output file
        const outputPath = filePath.replace(/\.enc$/, '');
        fs.writeFileSync(outputPath, decrypted);

        console.log(`✔ Decrypted: ${filePath}`);
        return true;
    } catch (err) {
        console.error(`✘ Error decrypting "${filePath}": Incorrect password or corrupted data.`);
        return false;
    }
}

// --- Recursively walk a directory ---
function walkDir(dir, callback) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    }
}

// --- Encrypt all files in a folder ---
function encryptFolder(folderPath, password) {
    walkDir(folderPath, (filePath) => {
        if (!filePath.endsWith('.enc')) {   // Skip already-encrypted files
            encryptFile(filePath, password);
            fs.unlinkSync(filePath);         // Delete original after encrypting
        }
    });
    console.log('\n🔒 All files encrypted.');
}

// --- Decrypt all .enc files in a folder ---
function decryptFolder(folderPath, password) {
    walkDir(folderPath, (filePath) => {
        if (filePath.endsWith('.enc')) {
            if (decryptFile(filePath, password)) {
                fs.unlinkSync(filePath);         // Delete .enc file after decrypting
            }
        }
    });
    console.log('\n🔓 All files decrypted.');
}

// --- CLI ---
if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args.find(a => !a.startsWith('--') && (a === 'encrypt' || a === 'decrypt'));
    const folder = args.find(a => !a.startsWith('--') && a !== mode);
    const isJson = args.includes('--json');

    if (!mode || !folder) {
        if (isJson) {
            console.log(JSON.stringify({ error: 'Usage: node index.js [mode] [folder] [--json]' }));
        } else {
            console.log('Usage:');
            console.log('  node index.js encrypt <folder> [--json]');
            console.log('  node index.js decrypt <folder> [--json]');
        }
        process.exit(1);
    }

    // Get password from environment or prompt
    let password = process.env.FILE_ENCRYPTOR_PASSWORD;

    if (!password) {
        if (isJson) {
            console.log(JSON.stringify({ error: 'FILE_ENCRYPTOR_PASSWORD environment variable is required for --json mode.' }));
            process.exit(1);
        }
        const readlineSync = require('readline-sync');
        password = readlineSync.question('Enter password: ', {
            hideEchoBack: true // Masking the password input
        });
    }

    const resolvedFolder = path.resolve(folder);

    if (!fs.existsSync(resolvedFolder)) {
        if (isJson) {
            console.log(JSON.stringify({ error: `folder "${resolvedFolder}" not found.` }));
        } else {
            console.error(`Error: folder "${resolvedFolder}" not found.`);
        }
        process.exit(1);
    }

    // Suppress console logs if --json is used
    if (isJson) {
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => {};
        console.error = () => {};

        try {
            if (mode === 'encrypt') {
                encryptFolder(resolvedFolder, password);
            } else {
                decryptFolder(resolvedFolder, password);
            }
            originalLog(JSON.stringify({ status: 'success', mode, folder: resolvedFolder }));
        } catch (err) {
            originalError(JSON.stringify({ status: 'error', message: err.message }));
            process.exit(1);
        }
    } else {
        if (mode === 'encrypt') {
            encryptFolder(resolvedFolder, password);
        } else if (mode === 'decrypt') {
            decryptFolder(resolvedFolder, password);
        } else {
            console.error(`Unknown mode: "${mode}". Use "encrypt" or "decrypt".`);
            process.exit(1);
        }
    }
}

module.exports = {
    deriveKey,
    encryptFile,
    decryptFile,
    walkDir,
    encryptFolder,
    decryptFolder
};