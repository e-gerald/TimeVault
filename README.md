# TimeVault

A secure file vault application built with Rust, React, and Tauri that allows users to encrypt and store files with time-based unlock mechanisms.

## Features

- **Secure File Storage**: Encrypt and store files in a password-protected vault
- **Time-Based Unlocking**: Set specific dates and times for when files become accessible
- **File Management**: Add, view, and manage encrypted files
- **Duplicate Handling**: Smart file naming system to handle duplicate files
- **Tamper Protection**: Detect and prevent unauthorized modifications to file metadata.
- **Flexible Decrypt & Unlock**: Decrypt and unlock either a single file or all eligible files in the vault at once.
- **Activity Logging**: Track all vault operations and file activities
- **Modern UI**: Clean, responsive interface with dark/light theme support
- **Cross-Platform**: Built with Tauri for native desktop performance

## Technology Stack

### Frontend
- **Framework**: React 19 with Vite
- **Desktop Framework**: Tauri 2.x
- **Styling**: Tailwind CSS
- **Date/Time**: React DatePicker and DateTime components
- **State Management**: React Hooks (useState, useEffect)

### Backend
- **Language**: Rust
- **Framework**: Tauri 2.x
- **Cryptography**: 
  - Argon2 (password hashing)
  - ChaCha20-Poly1305 (file encryption)
- **Serialization**: Serde with JSON
- **Async Runtime**: Tokio
- **HTTP Client**: Reqwest (with rustls-tls)
- **Date/Time**: Chrono
- **Security**: Zeroize (secure memory clearing)
- **Error Handling**: Anyhow
- **Random Generation**: Rand
- **Encoding**: Base64

## Installation

### Prerequisites

- Node.js (v18 or higher)
- Rust (for Tauri development)
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/e-gerald/TimeVault.git
cd vault-client
```

2. Install frontend dependencies:
```bash
cd vault-frontend
npm install
```

3. Install Tauri CLI (if not already installed):
```bash
cargo install tauri-cli
```

## Development

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. In a separate terminal, run the Tauri development build:
```bash
cd ..
cargo tauri dev
```

### Building for Production

1. Build the frontend:
```bash
npm run build
```

2. Build the Tauri application:
```bash
cargo tauri build
```

## Usage

### Creating a Vault

1. Launch the application
2. Click "Create New Vault" or "Open Existing Vault"
3. Select a directory for your vault
4. Set a master password

### Adding Files

1. Click "Add New File" on the dashboard
2. Select a file to encrypt
3. Set the unlock date/time for the file
4. Enter your vault password to confirm
5. The file will be encrypted and stored in the vault

### Managing Files

- **View Files**: See all files in your vault with their unlock dates
- **Unlock Files**: Click "Open" on unlocked files to decrypt and access them, or click "Unlock Vault" to decrept and access all eligible files in the vault
- **Activity Log**: Monitor all vault operations in the activity log
- **Refresh Status**: Check for any updates or changes

### File Conflicts

When adding a file with the same name as an existing file:
- Choose to rename the new file (automatically generates unique names)
- Cancel the operation to keep the original file

## Project Structure

```
vault-client/
├── vault-frontend/          # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddFileModal.jsx
│   │   │   ├── FileExistsDialog.jsx
│   │   │   └── ...
│   │   ├── context/         # React context providers
│   │   ├── styles/          # CSS and styling
│   │   └── App.jsx          # Main application component
│   ├── package.json
│   └── README.md
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs         # Tauri app entry point
│   │   └── vault.rs        # Core vault functionality
│   └── Cargo.toml
├── Cargo.toml              # Workspace configuration
└── Cargo.lock
```

## Security Features

- **Password Protection**: All vaults are protected with master passwords using Argon2
- **File Encryption**: Files are encrypted using ChaCha20-Poly1305 before storage
- **Time-Based Access**: Files can only be accessed after their unlock date
- **Secure Storage**: Encrypted files are stored locally on your device
- **Memory Security**: Sensitive data is securely cleared from memory using Zeroize

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Note**: This application handles sensitive data. Always ensure you have backups of your vault and remember your master password, as there is no password recovery mechanism.
```
