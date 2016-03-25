import Ember from 'ember';

const { isBlank } = Ember;

export default function (app) {
  let config = app.__container__.lookupFactory('config:environment'),
      shouldInitKeyboard;

  config = isBlank(config) ? {} : config;
  shouldInitKeyboard = config.keyboard;
  shouldInitKeyboard = isBlank(shouldInitKeyboard) ? true : shouldInitKeyboard;

  if (shouldInitKeyboard) {
    const factoryName = 'route:application',
          property = 'cordovaKeyboard',
          injectionName = 'service:cordova/keyboard';

    app.inject(factoryName, property, injectionName);
  }
}
