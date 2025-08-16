#!/usr/bin/env bash
# Run after npm/yarn install but before prebuild. Nothing to do for now.
set -euxo pipefail

# Workaround for environments where Ruby gems bin dir isn't persisted.
if ! command -v pod >/dev/null 2>&1 && [ -d "$HOME/.gem" ]; then
  RBVER=$(ruby -e 'print RUBY_VERSION.split(".").slice(0,2).join(".")')
  export PATH="$HOME/.gem/ruby/${RBVER}.0/bin:$PATH"
fi

which pod || true
pod --version || true
