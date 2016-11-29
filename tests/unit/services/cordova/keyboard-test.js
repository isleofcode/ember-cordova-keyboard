import Ember from 'ember';

import td from 'testdouble';
import { describeModule } from 'ember-mocha';
import {
  afterEach,
  beforeEach,
  context,
  describe,
  it
} from 'mocha';

const {
  A,
  RSVP: { Promise }
} = Ember;

describeModule(
  'service:cordova/keyboard',
  'KeyboardService',
  {
    needs: [
      'service:cordova'
    ]
  },
  function() {
    let cordova, keyboardPlugin, service;

    beforeEach(function() {
      cordova = this.container.owner.lookup('service:cordova'); // todo getOwner polyfill?

      context.cordova = {
        plugins: {
          Keyboard: {
            disableScroll: function() {
            }
          }
        }
      };

      service = this.subject();
      keyboardPlugin = context.cordova.plugins.Keyboard;

      cordova.trigger('deviceready');
    });

    afterEach(function() {
      td.reset();
    });

    describe('#init', function() {
      it('exists', function() {
        expect(service).to.be.ok;
      });
    });

    describe('#willDestroy', function() {
      let teardownListenersCalled;

      beforeEach(function() {
        teardownListenersCalled = false;

        td.replace(service, 'teardownListeners', function() {
          teardownListenersCalled = true;
        });

        service.teardownListeners();
      });

      it('tears down listeners', function() {
        expect(teardownListenersCalled).to.be.true;
      });
    });

    describe('#keyboard', function() {
      let keyboard;

      beforeEach(function() {
        service.keyboard()
          .then((_keyboard) => {
            keyboard = _keyboard;
          });
      });

      it('returns the keyboard plugin object', function() {
        expect(keyboard).to.equal(keyboardPlugin);
      });

      it('caches the keyboard plugin object on the service', function() {
        expect(service._keyboard).to.equal(keyboardPlugin);
      });
    });

    describe('#open', function() {
      let element, focusCalled, promise;

      beforeEach(function() {
        focusCalled = false;
      });

      context('when element is not the active element', function() {
        beforeEach(function() {
          element = {
            focus() {
              focusCalled = true;
            }
          };

          promise = service.open(element);
        });

        it('returns a promise', function() {
          let isPromise = promise instanceof Promise;
          expect(isPromise).to.be.true;
        });

        it('calls focus on the element', function() {
          expect(focusCalled).to.be.true;
        });
      });

      context('when element is the active element', function() {
        beforeEach(function() {
          element = document.activeElement;
          td.replace(element, 'focus', function() {
            focusCalled = true;
          });

          promise = service.open(element);
        });

        it('returns a promise', function() {
          let isPromise = promise instanceof Promise;
          expect(isPromise).to.be.true;
        });

        it('does not call focus on the element', function() {
          expect(focusCalled).to.be.false;
        });
      });
    });

    describe('#close', function() {
      let closeCalled, promise;

      beforeEach(function() {
        closeCalled = false;

        td.replace(keyboardPlugin, 'close', function() {
          closeCalled = true;
        });
      });

      context('when keyboard is visible', function() {
        beforeEach(function() {
          keyboardPlugin.isVisible = true;

          promise = service.close();
          return promise;
        });

        it('returns a promise', function() {
          let isPromise = promise instanceof Promise;
          expect(isPromise).to.be.true;
        });

        it('calls the cordova plugin\'s `close()`', function() {
          expect(closeCalled).to.be.true;
        });
      });

      context('when keyboard is not visible', function() {
        beforeEach(function() {
          keyboardPlugin.isVisible = false;
        });

        it('returns a promise', function() {
          let isPromise = promise instanceof Promise;
          expect(isPromise).to.be.true;
        });

        it('does not call the cordova plugin\'s `close()`', function() {
          expect(closeCalled).to.be.false;
        });
      });
    });

    describe('#disableScroll', function() {
      let disableScroll;

      beforeEach(function() {
        disableScroll = undefined;

        td.replace(keyboardPlugin, 'disableScroll', function(bool) {
          disableScroll = bool;
        });
      });

      context('when called with no args', function() {
        beforeEach(function() {
          service.disableScroll();
        });

        it('passes `disableScroll(true)` to cordova', function() {
          expect(disableScroll).to.be.true;
        });
      });

      context('when called with true', function() {
        beforeEach(function() {
          service.disableScroll(true);
        });

        it('passes `disableScroll(true)` to cordova', function() {
          expect(disableScroll).to.be.true;
        });
      });

      context('when called with false', function() {
        beforeEach(function() {
          service.disableScroll(false);
        });

        it('passes `disableScroll(true)` to cordova', function() {
          expect(disableScroll).to.be.false;
        });
      });

      context('when called with invalid args', function() {
        let fnDisableScroll;

        beforeEach(function() {
          fnDisableScroll = function() {
            service.disableScroll(123);
          };
        });

        it('throws', function() {
          expect(fnDisableScroll).to.throw(Error);
        });

        it('does not call cordova\'s `disableScroll()', function() {
          expect(disableScroll).to.be.undefined;
        });
      });
    });

    describe('#setup', function() {
      let disableScroll, listeners;

      beforeEach(function() {
        disableScroll = undefined;

        td.replace(keyboardPlugin, 'disableScroll', function(bool) {
          disableScroll = bool;
        });

        td.replace(service, 'setupListeners', function(_listeners) {
          listeners = new A(_listeners);
        });

        service.setup(keyboardPlugin);
      });

      it('calls cordova\'s `disableScroll()`', function() {
        let expectedArg = service.get('shouldDisableScroll');
        expect(disableScroll).to.equal(expectedArg);
      });

      it('calls setupListeners for keyboard[show|hide] events', function() {
        let onKeyboardShow = listeners.findBy('name', 'native.keyboardshow').fn,
            onKeyboardHide = listeners.findBy('name', 'native.keyboardhide').fn;

        expect(onKeyboardShow.name).to.equal('bound onKeyboardShow');
        expect(onKeyboardHide.name).to.equal('bound onKeyboardHide');
      });
    });

    describe('#onKeyboardShow', function() {
      let bodyHeight, keyboardHeight, event, keyboardDidShow;

      beforeEach(function() {
        bodyHeight = document.body.style.height;
        keyboardHeight = 100;
        event = { keyboardHeight: 100 };
        keyboardDidShow = false;

        service.on('keyboardDidShow', function() {
          keyboardDidShow = true;
        });
      });

      afterEach(function() {
        document.body.style.height = bodyHeight;
      });

      context('when `adjustBodyHeight` is true', function() {
        beforeEach(function() {
          service.set('adjustBodyHeight', true);
          service.onKeyboardShow(event);
        });

        it('caches `keyboardHeight`', function() {
          expect(service.get('keyboardHeight')).to.equal(keyboardHeight);
        });

        it('triggers `keyboardDidShow', function() {
          expect(keyboardDidShow).to.be.true;
        });

        it('caches body height in `_height`', function() {
          expect(service._height).to.equal(bodyHeight);
        });

        it('calculates a new body height', function() {
          let expectedHeight = 'calc(100% - ' + keyboardHeight + 'px)';
          expect(document.body.style.height).to.equal(expectedHeight);
        });
      });

      context('when `adjustBodyHeight` is not true', function() {
        beforeEach(function() {
          service.set('adjustBodyHeight', false);
          service.onKeyboardShow(event);
        });

        it('caches `keyboardHeight`', function() {
          expect(service.get('keyboardHeight')).to.equal(keyboardHeight);
        });

        it('triggers `keyboardDidShow', function() {
          expect(keyboardDidShow).to.be.true;
        });

        it('does not calculate a new body height', function() {
          expect(document.body.style.height).to.equal(bodyHeight);
        });
      });
    });

    describe('#onKeyboardHide', function() {
      let bodyHeight, event, keyboardDidHide;

      beforeEach(function() {
        bodyHeight = document.body.style.height;
        event = {};
        keyboardDidHide = false;

        service._height = bodyHeight;
        service.on('keyboardDidHide', function() {
          keyboardDidHide = true;
        });
      });

      afterEach(function() {
        document.body.style.height = bodyHeight;
      });

      context('when `adjustBodyHeight` is true', function() {
        beforeEach(function() {
          service.set('adjustBodyHeight', true);
          service.onKeyboardHide(event);
        });

        it('resets `keyboardHeight` to 0', function() {
          expect(service.get('keyboardHeight')).to.equal(0);
        });

        it('triggers `keyboardDidHide`', function() {
          expect(keyboardDidHide).to.be.true;
        });

        it('resets body height to `_height`', function() {
          expect(document.body.style.height).to.equal(service._height);
        });
      });

      context('when `adjustBodyHeight` is not true', function() {
        beforeEach(function() {
          service.set('adjustBodyHeight', false);
          service.onKeyboardHide(event);
        });

        it('resets `keyboardHeight` to 0', function() {
          expect(service.get('keyboardHeight')).to.equal(0);
        });

        it('triggers `keyboardDidHide`', function() {
          expect(keyboardDidHide).to.be.true;
        });

        it('does not reset body height', function() {
          expect(document.body.style.height).to.equal(bodyHeight);
        });
      });
    });

    describe('#setupListeners', function() {
      let listeners, passedListeners;

      beforeEach(function() {
        listeners = new A([
          { name: 'foo', fn: function foo() {} },
          { name: 'bar', fn: function bar() {} },
          { name: 'baz', fn: function baz() {} }
        ]);
        passedListeners = new A();

        td.replace(window, 'addEventListener', function(name, fn) {
          let listener = { name: name, fn: fn };
          passedListeners.pushObject(listener);
        });

        service._listeners = new A(); // reset cache; some were set via `init`
        service.setupListeners(listeners);
      });

      it('calls addEventListener for each listener', function() {
        listeners.forEach((listener) => {
          let _listener = passedListeners.findBy('name', listener.name);
          expect(_listener).to.deep.equal(listener);
        });
      });

      it('adds each listener to `_listeners`', function() {
        listeners.forEach((listener) => {
          let _listener = service._listeners.findBy('name', listener.name);
          expect(_listener).to.deep.equal(listener);
        });
      });
    });

    describe('#teardownListeners', function() {
      let listeners, removedListeners;

      beforeEach(function() {
        listeners = service._listeners;
        removedListeners = new A();

        td.replace(window, 'removeEventListener', function(name, fn) {
          let listener = { name: name, fn: fn };
          removedListeners.pushObject(listener);
        });

        service.teardownListeners();
      });

      it('calls removeEventListener for each listener', function() {
        listeners.forEach((listener) => {
          let _listener = removedListeners.findBy('name', listener.name);
          expect(_listener).to.deep.equal(listener);
        });
      });

      it('rms each listener from `_listeners`', function() {
        expect(service._listeners.length).to.equal(0);
      });
    });
  }
);
