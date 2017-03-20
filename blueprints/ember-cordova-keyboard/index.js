const ecInstaller   = require('ember-cordova-installer');

module.exports = {
  description: 'Installs the cordova ionic keyboard plugin',

  normalizeEntityName: function() {},

  afterInstall: function() {
    ecInstaller.install('ionic-plugin-keyboard', this);
  }
};

