#!/bin/bash
# hermes-studio wrapper — loads fnm/nvm environment, then execs the server.
# Used by systemd so the service gets the correct Node version.
set -e

# --- fnm ---
# Find fnm binary: check FNM_PATH, common install locations, then PATH
find_fnm() {
    # FNM_PATH env var (set by user or /etc/hermes-studio.env)
    if [ -n "${FNM_PATH:-}" ] && [ -x "$FNM_PATH/fnm" ]; then
        echo "$FNM_PATH/fnm"; return 0
    fi
    # Standard Linux install
    if [ -x "$HOME/.local/share/fnm/fnm" ]; then
        echo "$HOME/.local/share/fnm/fnm"; return 0
    fi
    # Alternative install location
    if [ -x "$HOME/.fnm/fnm" ]; then
        echo "$HOME/.fnm/fnm"; return 0
    fi
    # Already on PATH
    if command -v fnm >/dev/null 2>&1; then
        command -v fnm; return 0
    fi
    return 1
}

if fnm_bin=$(find_fnm); then
    export PATH="$(dirname "$fnm_bin"):$PATH"
    eval "$("$fnm_bin" env)"
fi

# --- nvm ---
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
fi

# Verify node version >= 23
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -lt 23 ]; then
    echo "ERROR: Node.js $(node -v) detected, v23+ required" >&2
    echo "Hint: install Node 23+ with fnm/nvm, or set FNM_PATH in /etc/hermes-studio.env" >&2
    exit 1
fi

exec node "$@"
