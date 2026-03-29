const { withAndroidGradleProperties } = require('@expo/config-plugins');

module.exports = function withGradleProperties(config) {
  return withAndroidGradleProperties(config, (config) => {
    const props = config.modResults;

    const set = (key, value) => {
      const existing = props.find((p) => p.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    set('KeyboardController_kotlinVersion', '2.0.21');
    set('KeyboardController_compileSdkVersion', '35');
    set('KeyboardController_targetSdkVersion', '35');
    set('KeyboardController_minSdkVersion', '24');

    return config;
  });
};
