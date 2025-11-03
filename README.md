# Allein

<div align="center">
  <img src="src/assets/allein-logo.png" alt="Allein logo" width="80" />
  <h2 style="border-bottom:none;margin-bottom: 0;">Markdown editor with built-in Ollama support</h2>
  <p>Intelligent auto-completion while working locally.</p>
</div>

---

## What Makes Allein Special

- **Smart inline suggestions** - AI-powered writing assistance directly in your editor
- **One-click text improvements** - Polish your writing with a single action
- **Local-first** - Works offline, all your files stay on your computer
- **No account needed** - Start writing immediately, no setup or tracking

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

# Install tools (versions from mise.toml)
mise install

# Install project dependencies
pnpm install
```

### Development

```bash
# Start dev server with hot reload
pnpm tauri dev
```

### Building

```bash
# Build native executable for your platform
pnpm tauri build
```

## AI-Powered Writing Suggestions

Allein integrates with [Ollama](https://ollama.ai) to bring AI writing assistance directly into your editor. Everything runs locally—your writing never leaves your machine.

### Enable AI Features

1. **Install Ollama**

   ```bash
   # macOS
   brew install ollama

   # or download from ollama.ai for Windows/Linux
   ```

2. **Start Ollama server**

   ```bash
   ollama serve
   ```

3. **Download a model** (we recommend `qwen2.5-coder:1.5b-base` for best results)

   ```bash
   ollama pull qwen2.5-coder:1.5b-base
   ```

4. **Configure Allein**
   - Open the app
   - Go to Settings
   - Allein will auto-detect your Ollama server (usually `http://localhost:11434`)
   - Select your model and you're done

That's it. You now have AI-powered writing suggestions running entirely on your computer.

## Contributing

We'd love your help making Allein better! Whether it's bug fixes, features, or documentation, every contribution matters.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.
