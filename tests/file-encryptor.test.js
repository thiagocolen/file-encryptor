const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { deriveKey, encryptFile, decryptFile, encryptFolder, decryptFolder } = require('../index');

const TEST_DIR = path.join(__dirname, 'temp-test-data');
const PASSWORD = 'test-password';

// Helper to setup/teardown test directory
function setup() {
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR);
}

function teardown() {
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
}

test('deriveKey returns a 32-byte buffer', () => {
    const salt = Buffer.alloc(16, 'salt');
    const key = deriveKey('password', salt);
    assert.strictEqual(key.length, 32);
    assert.ok(Buffer.isBuffer(key));
});

test('file encryption and decryption round-trip', () => {
    setup();
    const filePath = path.join(TEST_DIR, 'hello.txt');
    const content = 'Hello, encryption!';
    fs.writeFileSync(filePath, content);

    encryptFile(filePath, PASSWORD);
    assert.ok(fs.existsSync(filePath + '.enc'), 'Encrypted file should exist');
    
    // Decryption expects the .enc file and will recreate the original
    decryptFile(filePath + '.enc', PASSWORD);
    const decryptedContent = fs.readFileSync(filePath, 'utf8');
    assert.strictEqual(decryptedContent, content);
    
    teardown();
});

test('folder encryption and decryption round-trip', () => {
    setup();
    const subDir = path.join(TEST_DIR, 'sub');
    fs.mkdirSync(subDir);
    
    const file1 = path.join(TEST_DIR, 'file1.txt');
    const file2 = path.join(subDir, 'file2.txt');
    
    fs.writeFileSync(file1, 'content 1');
    fs.writeFileSync(file2, 'content 2');

    encryptFolder(TEST_DIR, PASSWORD);
    
    assert.ok(!fs.existsSync(file1), 'Original file1 should be deleted');
    assert.ok(fs.existsSync(file1 + '.enc'), 'file1.enc should exist');
    assert.ok(!fs.existsSync(file2), 'Original file2 should be deleted');
    assert.ok(fs.existsSync(file2 + '.enc'), 'file2.enc should exist');

    decryptFolder(TEST_DIR, PASSWORD);

    assert.ok(fs.existsSync(file1), 'Decrypted file1 should exist');
    assert.ok(!fs.existsSync(file1 + '.enc'), 'file1.enc should be deleted');
    assert.strictEqual(fs.readFileSync(file1, 'utf8'), 'content 1');
    
    assert.ok(fs.existsSync(file2), 'Decrypted file2 should exist');
    assert.ok(!fs.existsSync(file2 + '.enc'), 'file2.enc should be deleted');
    assert.strictEqual(fs.readFileSync(file2, 'utf8'), 'content 2');

    teardown();
});

test('decryption with wrong password should return false', () => {
    setup();
    const filePath = path.join(TEST_DIR, 'secret.txt');
    fs.writeFileSync(filePath, 'sensitive data');

    encryptFile(filePath, PASSWORD);
    
    const result = decryptFile(filePath + '.enc', 'wrong-password');
    assert.strictEqual(result, false, 'Decryption should return false on failure');

    teardown();
});
