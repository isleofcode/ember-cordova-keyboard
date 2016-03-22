/* global cordova */
import Ember from 'ember';

const {
  Service,
  inject,
  Evented,
  RSVP
} = Ember;

const {
  Promise
} = RSVP;

const KEYBOARD_ANIMATION_TIME = 300; //ms, guestimated based on various SO issues



export default Service.extend(Evented, {

  adjustBodyHeight: true,
  shouldDisableScroll: true,
  keyboardHeight: 0,

  cordova: inject.service('cordova'),

  /*
    We always access the keyboard via promise to ensure
    our interaction with it possible.
   */
  _keyboard: null,
  keyboard() {
    if (this._keyboard) {
      return Promise.resolve(this._keyboard);
    }
    return this.get('cordova').ready()
      .then(() => {
        this._keyboard = cordova.plugins.Keyboard;
        return this._keyboard;
      });
  },


  /*
    Opens the keyboard, unlike cordova.keyboard.open
    this method returns a promise that guestimates
    when the keyboard is done opening.

    Also, unlike cordova.keyboard, this method can
    accepts an element and will call focus on it.
   */
  open(element) {
    return this.keyboard()
      .then((kb) => {
        if (kb.isVisible) {
          if ("activeElement" in document && document.activeElement !== element) {
            element.focus();
          }

          return true;
        }

        return new Promise((resolve) => {
          if ("activeElement" in document && document.activeElement !== element) {
            element.focus();
          }
          run.later(() => { resolve(); }, KEYBOARD_ANIMATION_TIME);
        });
      });
  },


  /*
   Closes the keyboard, unlike cordova.keyboard.open
   this method returns a promise that guestimates
   when the keyboard is done opening.
   */
  close() {
    return this.keyboard()
      .then((kb) => {
        if (!kb.isVisible) {
          return true;
        }

        return new Promise((resolve) => {
          kb.close();
          run.later(() => { resolve(); }, KEYBOARD_ANIMATION_TIME);
        });
      });
  },


  disableScroll(v) {
    this.keyboard()
      .then((kb) => {
        this.set('shouldDisableScroll', v);
        kb.disableScroll(v);
      });
  },


  /*
   * Create a listener for each default Cordova event
   * and have it trigger the event on the service
   */
  _listeners: null,
  _height: null,
  setup(kb) {
    if (this._listeners) {
      return;
    }
    this._listeners = [];

    kb.disableScroll(this.get('shouldDisableScroll'));

    // add an additional handler for native.keyboardshow
    // ensure it fires first
    let listener = {
      name: 'native.keyboardshow',
      method: (e) => {
        this.set('keyboardHeight', e.keyboardHeight);

        if (this.get('adjustBodyHeight')) {
          this._height = document.body.style.height || '';
          document.body.style.height = "calc(100% - " + e.keyboardHeight + "px)";
        }

        this.trigger(name, e);
      }
    };
    this._listeners.push(listener.name, listener.method, true);

    // add an additional handler for native.keyboardhide
    // ensure it fires first
    listener = {
      name: 'native.keyboardhide',
      method: (e) => {
        this.set('keyboardHeight', 0);

        if (this.get('adjustBodyHeight')) {
          document.body.style.height = this._height;
        }

        this.trigger(name, e);
      }
    };
    this._listeners.push(listener.name, listener.method, true);

    this._listeners.forEach((l) => {
      window.addEventListener(l.name, l.method, true);
    });
  },


  teardownListeners() {
    if (!this._listeners) {
      return;
    }
    this._listeners.forEach((listener) => {
      window.removeEventListener(listener.name, listener.method, true);
    });
  },


  willDestroy() {
    this._super();
    this.teardownListeners();
  },


  init() {
    this._super();
    this.keyboard()
      .then((kb) => {
        this.setup(kb);
      });
  }

});
