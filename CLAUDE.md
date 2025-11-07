# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

allein is a cross-platform markdown editor built with Tauri v2, React 19, and TypeScript. It features live preview, Monaco Editor integration, and optional AI-powered writing assistance via local Ollama models.

## Development Commands

### Frontend Development
```bash
pnpm dev              # Start Vite dev server only
pnpm build            # Build frontend (TypeScript + Vite)
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues automatically
pnpm typecheck        # Run TypeScript type checking
pnpm check            # Run both typecheck and lint
```

**Note**: Pre-commit hooks automatically run ESLint (with auto-fix) and TypeScript type checking on staged files before each commit.

### Tauri Development
```bash
pnpm tauri dev        # Start full Tauri app with hot reload
pnpm tauri build      # Build production executable
```

**Note:** Use `pnpm tauri dev` for normal development as it starts both the frontend and Rust backend.

### Version Management
```bash
./bump-version.sh [patch|minor|major]  # Bump version, create commit & tag
gh release create v{VERSION} --notes "release notes"  # Create release after pushing
```

**IMPORTANT**: Always use `bump-version.sh` (updates package.json, Cargo.toml, tauri.conf.json). Use clean version numbers (e.g., `v0.7.2`) for releases.

**Release Notes Format**:
```markdown
## What's New

### 🚀 Feature Category

- Feature description
- Another feature

### 🎨 UI/UX Category

- UI improvement

### ⚙️ Configuration & Integration

- Configuration change

---

**Full Changelog**: https://github.com/szilarddoro/allein/compare/v{OLD_VERSION}...v{NEW_VERSION}
```

### Git Commits

Always include attribution in commit messages:
```bash
git commit -m "$(cat <<'EOF'
message here

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Architecture

### Frontend Structure (React)

Four routes via React Router:
- **`/`**: File browser (BrowserPage)
- **`/editor`**: Monaco editor with live preview (EditorPage)
- **`/settings`**: Ollama configuration (SettingsPage)
- **`/onboarding`**: Initial setup flow (OnboardingPage)

Layout: `AppLayout` wraps main routes, `OnboardingLayout` for onboarding.

### State Management

- **React Query**: Handles all async operations (file I/O, config, Ollama API)
- **SQLite** (via Tauri): Persistent config storage in `database.db`
  - Config interfaces: `src/lib/db/database.ts`
  - Migrations: `src-tauri/src/lib.rs` (never modify existing, always add new)
  - Runs automatically on app startup

### File Storage

Files stored at `~/allein/docs/` as markdown.
- Backend: Tauri Rust commands in `src-tauri/src/lib.rs`
- Frontend: React Query hooks in `src/lib/files/use*.ts`
- Naming: `Untitled-{N}.md` with auto-incrementing N

### Monaco Editor Integration

Path: `src/pages/editor/TextEditor.tsx`

Custom configuration:
- Markdown-only mode
- No minimap, line numbers, or standard autocomplete
- Custom inline completion provider for AI suggestions
- Auto-save functionality with debouncing

### AI Completion System

Path: `src/pages/editor/completion/`

**Overview**: Inline completion provider powered by local Ollama models with intelligent caching, debouncing (350ms), and context-aware prompt building.

**Architecture**:
1. **Integration** (`useInlineCompletion.ts`) - Registers with Monaco Editor inline completion API
2. **Provider** (`CompletionProvider.ts`) - Manages lifecycle, caching, metrics, request cancellation
3. **Context** (`extractContent.ts`, `buildCompletionPrompt.ts`) - Extracts sentences and builds contextual prompts
4. **Filtering** (`prefiltering.ts`, `multilineClassification.ts`) - Prevents unnecessary requests
5. **Processing** (`processSingleLineCompletion.ts`) - Word-level diffing and quality filtering
6. **Performance** (`CompletionMetrics.ts`, `CompletionCache.ts`) - LRU cache (500 items) and metrics tracking

**Key Features**:
- Previous sentence context for multi-sentence coherence
- Quality filtering: removes markdown, filters prefixes, removes duplication
- LRU cache (500 entries) with debouncing to reduce API calls
- Request cancellation and context preservation across paragraph boundaries
- Disabled when `ai_assistance_enabled` config is false

**Attribution**: Inspired by [continuedev/continue](https://github.com/continuedev/continue) (Apache 2.0). See NOTICE file for details.

### Model Download System

**Overview**: Users download and install Ollama models in onboarding. React Query streams progress from `/api/pull`, auto-detects existing installations, and persists config to SQLite.

**Key Components**: Interactive cards display model previews, progress bars track downloads, advanced options dialog allows custom Ollama URL configuration.

### Ollama Integration

- **Default URL**: `http://localhost:11434`
- **Provider**: `ollama-ai-provider-v2` with Vercel AI SDK
- **Configuration**: Supports both completion and improvement model selection via `useOllamaConfig()`
- **Model Management**: React Query hooks handle discovery, status checks, and streaming downloads with real-time progress tracking
- **Customization**: Users can configure custom Ollama server URLs during onboarding via AdvancedOptionsDialog

### Styling & Config

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Shadcn UI** components (Radix UI primitives)
- **Theme**: System/light/dark via `next-themes`
- **Fonts**: Inter (UI), Roboto Mono (editor)
- **Path alias**: `@/` → `src/` (vite.config.ts)

## Key Details

**File Naming** (`src/lib/files/validation.ts`): No empty names, no leading/trailing whitespace, must be unique.

**Editor State**: `/editor?file=/path/to/file.md` via `useCurrentFilePath()` hook.

**Setup**: TypeScript strict mode, ESLint (React/Hooks), React Query for async operations, Sonner for toast notifications.

## Licensing

**MIT License** (see LICENSE file). AI completion system inspired by [continuedev/continue](https://github.com/continuedev/continue) (Apache 2.0). See NOTICE for details.

## Code Organization Guidelines

### Component and File Co-location

**IMPORTANT**: Keep related components, hooks, and utilities co-located with their primary usage context. Do NOT move files to high-level shared directories unless they are genuinely used across multiple unrelated features.

**Preferred structure**:
```
src/pages/editor/
├── EditorPage.tsx           # Main page component
├── EditorHeader.tsx         # Header component (used only by EditorPage)
├── FileNameEditor.tsx       # File name editor (used only by EditorHeader)
├── TextEditor.tsx           # Monaco wrapper
├── useAutoSave.ts          # Auto-save hook (used only by EditorPage)
├── useEditorKeyBindings.ts # Keybindings hook (used only by EditorPage)
└── completion/             # All completion system code co-located
```

**Avoid**:
```
src/components/editor/       # ❌ Don't create generic shared folders
src/hooks/editor/            # ❌ Don't separate by file type
```

**When to extract to shared locations**:
- Component is used in 3+ unrelated features
- Hook is genuinely generic (e.g., `useToast`, `useCurrentFilePath`)
- Utility functions are domain-agnostic

**Benefits of co-location**:
- Easier to understand component dependencies
- Simpler refactoring and deletion
- Clear ownership and context
- Reduced cognitive load when navigating code
