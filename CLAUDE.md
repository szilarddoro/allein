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

**IMPORTANT**: Always use `bump-version.sh` (updates version files). Use clean version numbers (e.g., `v0.7.2`) for releases.

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

## Git Commits

**IMPORTANT**: Do NOT commit changes without explicit approval from the user. Always present changes for review first.

Always include attribution in commit messages:
```bash
git commit -m "$(cat <<'EOF'
message here

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Development Stack

The project uses:
- **Frontend**: React 19 with TypeScript, Vite, Tailwind CSS v4, Shadcn UI components
- **Backend**: Tauri v2 with Rust for native platform integration
- **State Management**: React Query for async operations, SQLite for persistent configuration
- **Editor**: Monaco Editor with Markdown-only mode and AI completion support
- **Styling**: Tailwind CSS v4, Shadcn UI (Radix primitives), light/dark/system theming

## Licensing

**AGPL-3.0 License** (see LICENSE file). AI completion system inspired by [continuedev/continue](https://github.com/continuedev/continue) (Apache 2.0). See NOTICE for details.

## Code Organization Guidelines

### Component and File Co-location

**IMPORTANT**: Keep related components, hooks, and utilities co-located with their primary usage context. Do NOT move files to high-level shared directories unless they are genuinely used across multiple unrelated features.

**Preferred approach**:
- Group components, hooks, and utilities by feature or page
- Keep a feature's related files together in the same directory
- Only extract to shared locations when genuinely needed

**When to extract to shared locations**:
- Component is used in 3+ unrelated features
- Hook is genuinely generic and domain-agnostic
- Utility functions are universally applicable

**Benefits of co-location**:
- Easier to understand component dependencies
- Simpler refactoring and deletion of features
- Clear ownership and context
- Reduced cognitive load when navigating code
- Self-contained features are easier to reason about

### Architecture Patterns

- Use **React Query** for all async operations and data fetching
- Use **window events** for communicating menu bar actions to other parts of the application (e.g., menu items triggering page updates)
- Keep component responsibilities focused: separate concerns like formatting logic, file I/O, and UI rendering
- Use callbacks and props for passing down behavior rather than direct state manipulation
