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
./bump-version.sh [patch|minor|major]  # Bump version across all files, commit, and tag
```

**IMPORTANT**: Always use the `bump-version.sh` script to bump versions. It updates:
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/tauri.conf.json`

The script automatically creates a commit and git tag. After running it:
```bash
git push && git push --tags
```

To create a GitHub release after bumping:
```bash
gh release create v{VERSION} --notes "your custom release notes"
```

**IMPORTANT**: Always use the version number (e.g., `v0.7.2`) as the release name. Never include additional details in the release name - keep it clean and simple.

### Git Commits

When making commits, always include yourself as a committer using the following format:

```bash
git commit -m "message" -m "🤖 Generated with Claude Code" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

Or use a HEREDOC for multi-line commits:

```bash
git commit -m "$(cat <<'EOF'
commit message here

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

This ensures proper attribution and makes it clear that the commit was generated with Claude Code.

## Architecture

### Frontend Structure (React)

The app uses React Router with three main routes:
- **`/` (BrowserPage)**: File browser/home view showing all markdown files
- **`/editor` (EditorPage)**: Main editing interface with Monaco Editor and live preview
- **`/settings` (SettingsPage)**: Configuration for Ollama connection and AI features

Path: `src/main.tsx:15-34`

Layout: `AppLayout` component wraps all routes, provides sidebar toggle and settings navigation.

### State Management

- **React Query** (`@tanstack/react-query`): All async operations (file I/O, config, Ollama API)
- **SQLite** (via Tauri plugin): Persistent storage for config
  - Database: `database.db` in Tauri app data directory
  - Tables: `config` (app settings)
  - TypeScript interfaces: `src/lib/db/database.ts`
  - **Migrations**: Defined in `src-tauri/src/lib.rs` (lines ~134-162)
    - Migration 1: Creates `config` table
    - **IMPORTANT**: Never modify existing migrations - always add new ones
    - Tauri's migration system runs automatically on app startup

### File Storage

Files are stored locally at `~/allein/docs/` as markdown files:
- Backend: Rust commands in `src-tauri/src/lib.rs:20-130`
- Commands: `list_files`, `read_file`, `write_file`, `create_file`, `delete_file`, `rename_file`
- Frontend hooks: `src/lib/files/use*.ts`

File naming convention: New files created as `Untitled-{N}.md` where N increments.

### Monaco Editor Integration

Path: `src/pages/editor/TextEditor.tsx`

Custom configuration:
- Markdown-only mode
- No minimap, line numbers, or standard autocomplete
- Custom inline completion provider for AI suggestions
- Auto-save functionality with debouncing

### AI Completion System

Path: `src/pages/editor/completion/`

Architecture:
1. **Provider Registration**: Monaco inline completion provider for markdown
2. **Triggering**: At word boundaries, after sentence endings, and after typing multiple words
3. **Debouncing**: 500ms delay for faster suggestions
4. **Request Flow**:
   - Sends full document with `<|CURSOR|>` marker to indicate completion position
   - Uses Ollama API directly with streaming disabled
   - System prompt optimized for inline completions (`completionSystemPrompt.ts`)
   - Temperature: 0.3 for focused completions
   - num_predict: 20 tokens maximum
5. **Quality Filtering**:
   - Removes markdown formatting (bold, italic, code)
   - Removes "Output:" and "->" prefixes from model responses
   - Takes only first line of multi-line responses
   - Removes surrounding quotes
   - Checks for duplicate text already present on current line
6. **Persistent Suggestions**: Cached suggestions persist as user types, with case-insensitive matching

**Important**:
- Inline completion is disabled when `ai_assistance_enabled` config is false
- Visual feedback: Rotating gradient border appears during completion generation (dev mode only)

### Ollama Integration

Configuration hooks:
- `useOllamaConfig()`: Returns provider instance, URL, and selected model
- `useOllamaModels()`: Fetches available models from Ollama server
- `useOllamaConnection()`: Tests connection to Ollama server

Default URL: `http://localhost:11434`

Provider: Uses `ollama-ai-provider-v2` package with Vercel AI SDK.

### Styling

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Shadcn UI** components (Radix UI primitives)
- **Theme**: System/light/dark via `next-themes`
- **Fonts**: Inter (UI), Roboto Mono (editor)

Path alias: `@/` maps to `src/` (configured in `vite.config.ts:20-22`)

## Key Implementation Details

### File Naming Validation

Path: `src/lib/files/validation.ts`

Rules enforced when renaming:
- No empty names
- No leading/trailing whitespace
- Must be unique among existing files
- Validation errors shown inline during edit

### React Router Query Params

Editor file selection: `/editor?file=/path/to/file.md`

Hook: `useCurrentFilePath()` syncs query param with URL state.

## Development Notes

- TypeScript strict mode enabled
- ESLint with React, TypeScript, and React Hooks plugins
- Monaco Editor theme switches with app theme (vs/vs-dark)
- All file operations are async and handled via React Query mutations
- Toast notifications use `sonner` library via custom `useToast()` hook

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
└── completion/             # Completion-related code
    ├── useInlineCompletion.ts
    └── CompletionFormatter.ts
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
