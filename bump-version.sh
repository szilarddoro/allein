#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if bump type is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Bump type not specified${NC}"
  echo "Usage: ./bump-version.sh [patch|minor|major]"
  exit 1
fi

BUMP_TYPE=$1

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Error: Invalid bump type '$BUMP_TYPE'${NC}"
  echo "Valid options: patch, minor, major"
  exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: $CURRENT_VERSION${NC}"

# Split version into major, minor, patch
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Bump version based on type
case $BUMP_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo -e "${GREEN}New version: $NEW_VERSION${NC}"

# Update package.json
echo "Updating package.json..."
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
rm package.json.bak

# Update Cargo.toml
echo "Updating Cargo.toml..."
sed -i.bak "s/^version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml
rm src-tauri/Cargo.toml.bak

# Update tauri.conf.json
echo "Updating tauri.conf.json..."
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json
rm src-tauri/tauri.conf.json.bak

# Update version.ts
echo "Updating version.ts..."
sed -i.bak "s/export const APP_VERSION = \"$CURRENT_VERSION\"/export const APP_VERSION = \"$NEW_VERSION\"/" src/lib/version.ts
rm src/lib/version.ts.bak

# Stage changes
echo "Staging changes..."
git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json src/lib/version.ts

# Create commit
echo "Creating commit..."
git commit -m "chore: bump version to $NEW_VERSION"

# Create tag
echo "Creating tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo -e "${GREEN}✓ Successfully bumped version to $NEW_VERSION${NC}"
echo -e "${YELLOW}Don't forget to push changes and tags:${NC}"
echo -e "  git push && git push --tags"
