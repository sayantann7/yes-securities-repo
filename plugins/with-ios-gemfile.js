// Expo config plugin to ensure ios/Gemfile exists during prebuild so EAS uses `bundle exec pod install`.
// This fixes EAS iOS builds failing at "Install pods" with `spawn pod ENOENT` on some builders.

const fs = require('fs');
const path = require('path');
// Import from 'expo/config-plugins' so we don't require installing a separate package.
const { withDangerousMod } = require('expo/config-plugins');

module.exports = function withIosGemfile(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosDir = cfg.modRequest.platformProjectRoot; // <project>/ios
      const gemfilePath = path.join(iosDir, 'Gemfile');
      const content = [
        "source 'https://rubygems.org'",
        "gem 'cocoapods', '~> 1.15.2'",
        ''
      ].join('\n');

      try {
        // Ensure ios directory exists (defensive); Expo should create it before this mod runs.
        if (!fs.existsSync(iosDir)) {
          fs.mkdirSync(iosDir, { recursive: true });
        }
        // Only write if missing to avoid overwriting user-managed Gemfile
        if (!fs.existsSync(gemfilePath)) {
          fs.writeFileSync(gemfilePath, content, 'utf8');
          console.log('[with-ios-gemfile] Created ios/Gemfile with CocoaPods 1.15.2');
        } else {
          console.log('[with-ios-gemfile] ios/Gemfile already present — leaving as-is');
        }
      } catch (e) {
        // Best-effort; don't fail prebuild if we cannot write. Build will still attempt global `pod`.
        console.warn('[with-ios-gemfile] Failed to create ios/Gemfile:', e.message);
      }

      return cfg;
    },
  ]);
};
