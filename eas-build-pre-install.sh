#!/usr/bin/env bash
# Ensure Bundler and CocoaPods are available on the EAS macOS builder.
# This mitigates `spawn pod ENOENT` during the "Install pods" step.

set -euo pipefail

echo "[pre-install] Ruby: $(ruby -v)"
echo "[pre-install] Gem: $(gem -v)"

# Install Bundler if missing (pin to match eas.json)
if ! command -v bundle >/dev/null 2>&1; then
  echo "[pre-install] Installing bundler 2.5.10"
  gem install --user-install bundler -v 2.5.10
fi

# Install CocoaPods if missing (pin to match eas.json)
if ! command -v pod >/dev/null 2>&1; then
  echo "[pre-install] Installing cocoapods 1.15.2"
  gem install --user-install cocoapods -v 1.15.2
fi

# Ensure user gem bin paths are on PATH for subsequent steps
USER_GEM_BIN=$(ruby -r rubygems -e 'puts Gem.user_dir')/bin
RUBY_GEM_BIN=$(ruby -r rubygems -e 'puts Gem.bindir')
export PATH="$USER_GEM_BIN:$RUBY_GEM_BIN:$PATH"

# Persist PATH changes for later steps when possible
if [ -n "${BASH_ENV:-}" ]; then
  echo "export PATH=\"$USER_GEM_BIN:$RUBY_GEM_BIN:\$PATH\"" >> "$BASH_ENV" || true
fi
echo "export PATH=\"$USER_GEM_BIN:$RUBY_GEM_BIN:\$PATH\"" >> "$HOME/.profile" || true

echo "[pre-install] bundle: $(bundle --version || echo 'not found')"
echo "[pre-install] pod: $(pod --version || echo 'not found')"
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
