/* global Event */
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import td from 'testdouble';

const fireDeviceReady = function() {
  window.document.dispatchEvent(new Event('deviceready'));
};

module('Integration | Service | cordova/keyboard', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.keyboardService = this.owner.lookup('service:ember-cordova/keyboard');

    this.pluginDouble = td.object({
      close: function() {},
      disableScroll: function() {}
    });

    this.elementDouble = td.object({
      focus: function() {}
    });

    window.Keyboard = this.pluginDouble;
  });

  hooks.afterEach(function() {
    td.reset();
  });

  test('close event proxied when keyboard is visible', function(assert) {
    assert.expect(0);

    this.pluginDouble.isVisible = true;

    this.keyboardService.close();
    fireDeviceReady();

    return settled().then(() => {
      td.verify(this.pluginDouble.close());
    });
  });

  test('calling close resolves with true if keyboard is initially not visible', function(assert) {
    assert.expect(1);

    this.pluginDouble.isVisible = false;

    this.keyboardService.close().then((value) => {
      this.resolvedCloseValue = value;
    });
    fireDeviceReady();

    return settled().then(() => {
      assert.ok(this.resolvedCloseValue);
    });
  });

  test('calling open resolves with true if keyboard is initially visible', function(assert) {
    assert.expect(1);

    this.pluginDouble.isVisible = true;

    this.keyboardService.open(this.elementDouble).then((value) => {
      this.resolvedOpenValue = value;
    });
    fireDeviceReady();

    return settled().then(() => {
      assert.ok(this.resolvedOpenValue);
    });
  });

  test('calling open focuses the element', function(assert) {
    assert.expect(0);

    this.pluginDouble.isVisible = false;

    this.keyboardService.open(this.elementDouble);
    fireDeviceReady();

    return settled().then(() => {
      td.verify(this.elementDouble.focus());
    });
  });
});
