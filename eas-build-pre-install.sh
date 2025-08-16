#!/usr/bin/env bash
# Ensure CocoaPods is available on EAS macOS builders before the "Install pods" step.
# Some images may not have a global `pod` on PATH when a Gemfile is not detected.
# We install it to the current user's gem directory and export PATH so the next steps can find it.
set -euxo pipefail

# Print Ruby version for diagnostics
ruby -v || true

if ! command -v pod >/dev/null 2>&1; then
  echo "[eas-build-pre-install] CocoaPods not found on PATH. Installing locally via RubyGems..."
  export GEM_HOME="$HOME/.gem"
  # Derive the major.minor for Ruby to build the bin path (e.g., ~/.gem/ruby/3.3.0/bin)
  RBVER=$(ruby -e 'print RUBY_VERSION.split(".").slice(0,2).join(".")')
  export GEM_BIN="$GEM_HOME/ruby/${RBVER}.0/bin"
  mkdir -p "$GEM_BIN"
  export PATH="$GEM_BIN:$PATH"
  gem install cocoapods -v 1.15.2 --no-document --user-install
else
  echo "[eas-build-pre-install] CocoaPods already available: $(pod --version)"
fi

# Ensure `pod` is visible to subsequent steps
export PATH
which pod
pod --version
