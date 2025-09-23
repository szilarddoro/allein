# allein.app

A modern, cross-platform markdown editor built with Tauri, React, and TypeScript. Features live preview, AI assistance via Ollama, and a clean, distraction-free writing experience.

## Features

- **Live Markdown Editing** - Real-time preview with Monaco Editor
- **AI Integration** - Connect to local Ollama server for AI assistance
- **Cross-Platform** - Runs on Windows, macOS, and Linux
- **Modern UI** - Built with Tailwind CSS and Shadcn UI components
- **Keyboard Shortcuts** - Efficient writing with customizable hotkeys
- **Settings Management** - Persistent configuration with SQLite

## Prerequisites

- **Node.js** (v18 or later)
- **pnpm** (recommended package manager)
- **Rust** (latest stable version)
- **Ollama** (optional, for AI features)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/szilarddoro/allein.git
   cd allein
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Install Rust dependencies**

   ```bash
   # Install Rust (if not already installed)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

   # Install Tauri CLI
   cargo install tauri-cli
   ```

## Development

1. **Start the development server**

   ```bash
   pnpm tauri dev
   ```

2. **Build for production**
   ```bash
   pnpm tauri build
   ```

## AI Features (Optional)

To enable AI features, install and run Ollama:

1. **Install Ollama**
   - Visit [ollama.ai](https://ollama.ai) and download for your platform
   - Or use package managers: `brew install ollama` (macOS), `winget install Ollama.Ollama` (Windows)

2. **Start Ollama server**

   ```bash
   ollama serve
   ```

3. **Pull a model** (recommended: `gemma2:2b`)

   ```bash
   ollama pull gemma2:2b
   ```

4. **Configure in app**
   - Open Settings (gear icon)
   - Set Ollama server URL (default: `http://localhost:11434`)
   - Select your preferred model

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
