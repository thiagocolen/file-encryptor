# 🔐 File Encryptor

A lightweight **Node.js** CLI tool that **encrypts** and **decrypts** all files inside a folder (including subfolders) using **AES-256-GCM** — one of the strongest symmetric encryption algorithms available.

---

## ✨ Features

- 🔒 **AES-256-GCM** encryption with authenticated encryption (tamper-proof)
- 🔑 **Password-based key derivation** using `scrypt` (resistant to brute-force)
- 📁 **Recursive folder processing** — handles nested subdirectories automatically
- 🗑️ **Auto-cleanup** — original files are deleted after encryption; `.enc` files are deleted after decryption
- 🚫 **No external dependencies** — uses only Node.js built-in modules (`crypto`, `fs`, `path`, `readline`)

---

## 📋 Prerequisites

| Requirement | Version |
|-------------|---------|
| **Node.js** | `>= 14.x` |
| **npm**     | `>= 6.x`  |

> [!NOTE]
> No `npm install` is required — the project has **zero dependencies**.

---

## 🚀 Quick Start

### 1️⃣ Clone the repository

```bash
git clone https://github.com/<your-username>/file-encryptor.git
cd file-encryptor
```

### 2️⃣ Place your files

Put the files you want to encrypt/decrypt inside the `./target-folder` directory. Subfolders are supported.

```
target-folder/
├── my-notes.txt
├── secrets/
│   ├── passwords.txt
│   └── keys.json
└── docs/
    └── plan.md
```

### 3️⃣ Encrypt all files

```bash
npm run encrypt
```

You'll be prompted for a password:

```
Enter password: ********
✔ Encrypted: target-folder/my-notes.txt
✔ Encrypted: target-folder/secrets/passwords.txt
✔ Encrypted: target-folder/secrets/keys.json
✔ Encrypted: target-folder/docs/plan.md

🔒 All files encrypted.
```

After encryption, original files are replaced with `.enc` files:

```
target-folder/
├── my-notes.txt.enc
├── secrets/
│   ├── passwords.txt.enc
│   └── keys.json.enc
└── docs/
    └── plan.md.enc
```

### 4️⃣ Decrypt all files

```bash
npm run decrypt
```

Enter the **same password** used during encryption:

```
Enter password: ********
✔ Decrypted: target-folder/my-notes.txt.enc
✔ Decrypted: target-folder/secrets/passwords.txt.enc
✔ Decrypted: target-folder/secrets/keys.json.enc
✔ Decrypted: target-folder/docs/plan.md.enc

🔓 All files decrypted.
```

---

## 🛠️ NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `encrypt` | `npm run encrypt` | 🔒 Encrypts all files in `./target-folder` |
| `decrypt` | `npm run decrypt` | 🔓 Decrypts all `.enc` files in `./target-folder` |

---

## 🤖 Agentic Workflow Integration

This tool is designed to be easily integrated into autonomous agent workflows (like **Gemini CLI**).

### 🔑 Non-Interactive Mode
To avoid interactive password prompts, use the `FILE_ENCRYPTOR_PASSWORD` environment variable.

```bash
# Set password in environment
export FILE_ENCRYPTOR_PASSWORD="your-strong-password"

# Run without prompt
node index.js encrypt ./my-data
```

### 📊 JSON Output
Use the `--json` flag to receive structured output. This will suppress all standard progress messages and return a single JSON object.

```bash
node index.js encrypt ./my-data --json
```

**Success Response:**
```json
{ "status": "success", "mode": "encrypt", "folder": "/path/to/my-data" }
```

**Error Response:**
```json
{ "error": "FILE_ENCRYPTOR_PASSWORD environment variable is required for --json mode." }
```

---

## 🔧 How It Works — Technical Details

### 🧬 Encryption Algorithm

| Parameter       | Value           |
|-----------------|-----------------|
| **Algorithm**   | `AES-256-GCM`  |
| **Key Length**   | 32 bytes (256 bits) |
| **IV Length**    | 16 bytes (128 bits) |
| **Salt Length**  | 16 bytes        |
| **Auth Tag**     | 16 bytes        |
| **Key Derivation** | `scrypt`     |

### 🗂️ Encrypted File Format

Each `.enc` file stores all the data needed for decryption in a single binary blob:

```
┌──────────┬──────────┬──────────────┬──────────────────┐
│  Salt    │   IV     │  Auth Tag    │  Encrypted Data  │
│ 16 bytes │ 16 bytes │  16 bytes    │  N bytes         │
└──────────┴──────────┴──────────────┴──────────────────┘
```

### 🔄 Process Flow

```
ENCRYPTION:
  Password → scrypt(salt) → Key
  Plaintext + Key + IV → AES-256-GCM → Ciphertext + AuthTag
  Output: salt | iv | authTag | ciphertext → file.enc

DECRYPTION:
  Read .enc file → extract salt, iv, authTag, ciphertext
  Password → scrypt(salt) → Key
  Ciphertext + Key + IV + AuthTag → AES-256-GCM → Plaintext
```

---

## ⚠️ Important Notes

> [!CAUTION]
> **Don't forget your password!** There is no way to recover encrypted files if you lose your password. The encryption is irreversible without it.

> [!WARNING]
> **Original files are deleted** after encryption. Make sure you have backups before running the encrypt command for the first time.

> [!IMPORTANT]
> **Same password required** — You must use the exact same password for decryption that was used during encryption. A wrong password will result in an authentication error.

---

## 📂 Project Structure

```
file-encryptor/
├── index.js          # 🧠 Main encryption/decryption logic
├── package.json      # 📦 Project config with npm scripts
├── target-folder/    # 📁 Default folder for encrypt/decrypt operations
├── prompt.md         # 📝 Project prompt
└── README.md         # 📖 This file
```

---

## 🛡️ Security Overview

| Feature | Details |
|---------|---------|
| **Encryption** | AES-256-GCM (military-grade, authenticated) |
| **Key Derivation** | scrypt (memory-hard, resistant to GPU/ASIC attacks) |
| **Random Salt** | Unique per file — same password produces different ciphertext |
| **Random IV** | Unique per file — prevents pattern analysis |
| **Auth Tag** | Ensures integrity — detects any tampering |

---

## 📜 License

ISC

---

<p align="center">
  Made with 🔐 and ❤️
</p>
