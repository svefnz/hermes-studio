#!/bin/bash
# hermes-studio wrapper — loads fnm/nvm environment, then execs the server.
# Used by systemd so the service gets the correct Node version.
set -e

# --- fnm ---
if [ -f "$HOME/.local/share/fnm/env" ]; then
    . "$HOME/.local/share/fnm/env"
elif command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env)"
fi

# --- nvm ---
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
fi

# Verify node version >= 23
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -lt 23 ]; then
    echo "ERROR: Node.js v$(node -v) detected, v23+ required" >&2
    exit 1
fi

exec node "$@"
