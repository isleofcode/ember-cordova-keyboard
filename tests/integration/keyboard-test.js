/* global Event */
import { moduleFor, test } from 'ember-qunit';
import td from 'testdouble';
import wait from 'ember-test-helpers/wait';

const fireDeviceReady = function() {
  window.document.dispatchEvent(new Event('deviceready'));
};

moduleFor('service:ember-cordova/keyboard', 'Integration | Service | cordova/keyboard', {
  integration: true,

  beforeEach: function() {
    this.keyboardService = this.subject();

    this.pluginDouble = td.object({
      close: function() {},
      disableScroll: function() {}
    });

    this.elementDouble = td.object({
      focus: function() {}
    });

    window.Keyboard = this.pluginDouble;
  },

  afterEach: function() {
    td.reset();
  }
});

test('close event proxied when keyboard is visible', function(assert) {
  assert.expect(0);

  this.pluginDouble.isVisible = true;

  this.keyboardService.close();
  fireDeviceReady();

  return wait().then(() => {
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

  return wait().then(() => {
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

  return wait().then(() => {
    assert.ok(this.resolvedOpenValue);
  });
});

test('calling open focuses the element', function(assert) {
  assert.expect(0);

  this.pluginDouble.isVisible = false;

  this.keyboardService.open(this.elementDouble);
  fireDeviceReady();

  return wait().then(() => {
    td.verify(this.elementDouble.focus());
  });
});
