// Expo config plugin to force disable Android backups (allowBackup & fullBackupContent)
// Some libraries may merge a manifest that re-enables backups; this plugin enforces false.

const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAndroidDisableBackup(config) {
  return withAndroidManifest(config, async (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest) return cfg;
    if (!manifest.$) manifest.$ = {};
    // Ensure tools namespace for tools:replace usage
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';

    const app = manifest.application && manifest.application[0];
    if (app) {
      if (!app.$) app.$ = {};
      app.$['android:allowBackup'] = 'false';
      app.$['android:fullBackupContent'] = 'false';
      // Force override if another manifest sets these differently
      const existingReplace = (app.$['tools:replace'] || '').split(',').map(s => s.trim()).filter(Boolean);
      for (const attr of ['android:allowBackup', 'android:fullBackupContent']) {
        if (!existingReplace.includes(attr)) existingReplace.push(attr);
      }
      app.$['tools:replace'] = existingReplace.join(',');
    }
    return cfg;
  });
};
