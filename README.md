# Allein

A Markdown editor powered by **your LLM**. Like GitHub Copilot, but local and free. No account required.

![allein-demo](https://github.com/user-attachments/assets/c3cfabaf-70f1-4db7-9066-c8c4ec1d59ea)

## What's Included

- ⚡ **Context-aware autocompletion** - Like GitHub Copilot, but local
- ✨ **Writing improvements** - Intelligent text refinement that fixes spelling and grammar, and many more
- 🛡️ **100% offline** - Works offline, and you choose where you store your files
- 👤 **No account needed** - Complete the onboarding process, and you'll be all set – no registration is required

## Getting Started

### Setup

This project uses [mise](https://mise.jdx.dev/) to manage required tools (Node.js, pnpm, Rust). If you haven't installed mise yet:

```bash
# Install mise (macOS/Linux)
curl https://mise.run | sh
```

Then clone and get developing:

```bash
# Clone the repo
git clone https://github.com/szilarddoro/allein.git
cd allein
# Install tools (versions from mise.toml - you may need to restart the terminal first)
mise install
# Install project dependencies
pnpm install
```

### Development

```bash
# Start dev server with hot reload
pnpm tauri dev
```

### Release Build

```bash
# Build native executable for your platform
pnpm tauri build
```

## AI-Powered Writing Suggestions

Allein integrates with [Ollama](https://ollama.com) to bring AI writing assistance directly into your editor. Everything runs locally—your writing never leaves your machine.

### Setup Ollama

First, install and start Ollama on your machine:

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   # or download from ollama.com
   ```
2. **Start Ollama server**
   ```bash
   ollama serve
   ```

### Download and Configure Models

You can download and configure models in two ways:

#### Option 1: Use the App Onboarding

Simply start Allein and go through the onboarding flow—the app will guide you through downloading and configuring models directly in the UI.

#### Option 2: Download via Terminal

Download the recommended models for different features:

```bash
# For context-aware autocompletion
ollama pull qwen2.5-coder:3b-base
# For writing improvement
ollama pull gemma3:latest
```

Then configure them in Allein settings. The app will auto-detect your Ollama server at `http://localhost:11434` (or you can customize the URL if your server is running on a different host/port).
That's it! 🎉

## Support & Contributing

Allein is an independent, community-driven project built with ❤️. There are several ways you can help it grow:

### Contribute Code

We'd love your help making Allein better! Whether it's bug fixes, features, or documentation, every contribution matters.

1. Fork the repository
2. Create a feature branch `git checkout -b feature/amazing-feature`
3. Commit your changes `git commit -m 'Add amazing feature'`
4. Push to the branch `git push origin feature/amazing-feature`
5. Open a Pull Request

### Support Development

Since this project isn't backed by any large companies, your support helps keep development active and the project thriving. Consider supporting via:

- **[Buy Me a Coffee](https://buymeacoffee.com/szilarddoro)** - One-time or recurring support
- **Code contributions** - Your PRs and improvements are invaluable
- **Feedback & bug reports** - Help us identify and fix issues

Every bit of support, whether it's code, coffee, or kind words, genuinely makes a difference. Thank you! ☕

## License

AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.
