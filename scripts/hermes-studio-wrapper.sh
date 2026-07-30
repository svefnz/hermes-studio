#!/bin/bash
# hermes-studio wrapper — resolves the correct Node.js binary, then execs the server.
# Used by systemd so the service gets the right Node version regardless of how it was installed.
set -e

# --- Resolve Node.js via fnm directory structure ---
resolve_fnm_node() {
    local fnm_dir="${FNM_DIR:-${FNM_PATH:-$HOME/.local/share/fnm}}"
    # Follow the default alias symlink
    if [ -L "$fnm_dir/aliases/default" ]; then
        local node_bin
        node_bin="$(readlink -f "$fnm_dir/aliases/default")/bin"
        if [ -x "$node_bin/node" ]; then
            echo "$node_bin"
            return 0
        fi
    fi
    # Find the latest installed version
    local latest
    latest=$(ls -1d "$fnm_dir/node-versions"/v* 2>/dev/null | sort -V | tail -1)
    if [ -n "$latest" ] && [ -x "$latest/installation/bin/node" ]; then
        echo "$latest/installation/bin"
        return 0
    fi
    return 1
}

# --- Resolve Node.js via nvm directory structure ---
resolve_nvm_node() {
    local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
    # Try the default alias
    local default_ver
    default_ver=$(cat "$nvm_dir/alias/default" 2>/dev/null) || true
    if [ -n "$default_ver" ] && [ -x "$nvm_dir/versions/node/$default_ver/bin/node" ]; then
        echo "$nvm_dir/versions/node/$default_ver/bin"
        return 0
    fi
    # Find the latest installed version
    local latest
    latest=$(ls -1d "$nvm_dir/versions/node"/v* 2>/dev/null | sort -V | tail -1)
    if [ -n "$latest" ] && [ -x "$latest/bin/node" ]; then
        echo "$latest/bin"
        return 0
    fi
    return 1
}

# --- Try fnm, then nvm, then system PATH ---
NODE_BIN=""
NODE_BIN=$(resolve_fnm_node) || true
if [ -z "$NODE_BIN" ]; then
    NODE_BIN=$(resolve_nvm_node) || true
fi
if [ -z "$NODE_BIN" ]; then
    # Fall back to whatever node is on PATH
    NODE_BIN=$(dirname "$(command -v node 2>/dev/null || echo /usr/bin/node)")
fi

# Verify node version >= 23
NODE_MAJOR=$("$NODE_BIN/node" -e "console.log(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -lt 23 ]; then
    echo "ERROR: Node.js $($NODE_BIN/node -v 2>/dev/null || echo unknown) detected, v23+ required" >&2
    echo "Hint: install Node 23+ with fnm/nvm, or set FNM_PATH in /etc/hermes-studio.env" >&2
    exit 1
fi

exec "$NODE_BIN/node" "$@"
