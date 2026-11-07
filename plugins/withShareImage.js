// Adds "Card Scanner" to the Android Share menu for images.
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

module.exports = function withShareImage(config) {
  return withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    const filters = activity['intent-filter'] ?? [];
    const already = filters.some((f) =>
      (f.action ?? []).some((a) => a.$['android:name'] === 'android.intent.action.SEND'),
    );
    if (!already) {
      filters.push({
        action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
        category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
        data: [{ $: { 'android:mimeType': 'image/*' } }],
      });
    }
    activity['intent-filter'] = filters;
    return cfg;
  });
};
