#!/usr/bin/env bash
# Cloud Agent install: Node from .node-version, Bun from packageManager, deps, web env files.
# Idempotent — safe to run repeatedly and against cached state.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

node_version="$(tr -d '[:space:]' < .node-version)"

# The base image ships nvm. Install the pinned Node and make it the nvm default.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install "$node_version" >/dev/null
nvm alias default "$node_version" >/dev/null
nvm use "$node_version" >/dev/null

# Absolute path to the pinned Node bin dir.
node_bin="$(dirname "$(nvm which "$node_version")")"
export PATH="$node_bin:$PATH"

# A Cursor-managed `/exec-daemon` Node shim can shadow nvm on PATH in login
# shells. Prepend the pinned Node bin dir from the login profiles so interactive
# shells (and `bash -l -c ...`) resolve that Node too. Idempotent.
marker="# >>> heynbord node (managed by .cursor/install.sh) >>>"
hook="${marker}
export PATH=\"${node_bin}:\$PATH\"
# <<< heynbord node (managed by .cursor/install.sh) <<<"
for profile in "$HOME/.profile" "$HOME/.bash_profile" "$HOME/.bashrc"; do
  [ -f "$profile" ] || continue
  if ! grep -qF "$marker" "$profile"; then
    printf '\n%s\n' "$hook" >>"$profile"
  fi
done

bun_version="$(node -p "require('./package.json').packageManager.replace(/^bun@/, '')")"
if ! command -v bun >/dev/null 2>&1 || [ "$(bun --version)" != "$bun_version" ]; then
  npm install --global "bun@${bun_version}"
fi

# `bun web` runs through portless. Install it into the same Node bin dir.
if ! command -v portless >/dev/null 2>&1; then
  npm install --global portless
fi

bun ci

# Seed web env files. CI does the same when WEB_ENV_FILE is empty.
for target in .env.local .env.prod; do
  if [ ! -f "apps/web/$target" ]; then
    cp apps/web/.env.example "apps/web/$target"
  fi
done

echo "install.sh complete: node $(node -v), bun $(bun --version)"
