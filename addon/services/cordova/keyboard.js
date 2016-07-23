/* global cordova */
import Ember from 'ember';

const {
  A,
  Evented,
  RSVP,
  Service,
  copy,
  inject,
  run
} = Ember;

const { Promise } = RSVP;
const KEYBOARD_ANIMATION_TIME = 300; //ms, guestimated from SO recommendations

export default Service.extend(Evented, {
  cordova: inject.service('cordova'),

  adjustBodyHeight: true,
  shouldDisableScroll: true,
  keyboardHeight: 0,

  _listeners: null,
  _height: null,

  init() {
    this._super();

    this._listeners = new A();
    this.keyboard().then(kb => { this.setup(kb); });
  },

  willDestroy() {
    this.teardownListeners();
    this._super();
  },

  _keyboard: null,
  keyboard() {
    if (this._keyboard) { return Promise.resolve(this._keyboard); }

    return this.get('cordova').ready()
      .then(() => {
        this._keyboard = cordova.plugins.Keyboard;
        return this._keyboard;
      });
  },

  open(element) {
    return this.keyboard().then(kb => {
      const elementShouldFocus = "activeElement" in document &&
        document.activeElement !== element;

      if (kb.isVisible) {
        if (elementShouldFocus) { element.focus(); }
        return true;
      }

      return new Promise(resolve => {
        if (elementShouldFocus) { element.focus(); }
        run.later(() => { resolve(); }, KEYBOARD_ANIMATION_TIME);
      });
    });
  },

  close() {
    return this.keyboard().then(kb => {
      if (!kb.isVisible) { return true; }

      return new Promise(resolve => {
        kb.close();
        run.later(() => { resolve(); }, KEYBOARD_ANIMATION_TIME);
      });
    });
  },

  disableScroll(bool) {
    this.keyboard().then((kb) => {
      this.set('shouldDisableScroll', bool);
      kb.disableScroll(bool);
    });
  },

  setup(kb) {
    const onKeyboardShow = this.onKeyboardShow.bind(this),
          onKeyboardHide = this.onKeyboardHide.bind(this),
          listeners = [
            { name: 'native.keyboardshow', fn: onKeyboardShow },
            { name: 'native.keyboardhide', fn: onKeyboardHide }
          ];

    kb.disableScroll(this.get('shouldDisableScroll'));
    this.setupListeners(listeners);
  },

  onKeyboardShow(e) {
    this.set('keyboardHeight', e.keyboardHeight);

    if (this.get('adjustBodyHeight')) {
      this._height = document.body.style.height || '';
      document.body.style.height = "calc(100% - " + e.keyboardHeight + "px)";
    }

    this.trigger('keyboardDidShow', e);
  },

  onKeyboardHide(e) {
    this.set('keyboardHeight', 0);

    if (this.get('adjustBodyHeight')) {
      document.body.style.height = this._height;
    }

    this.trigger('keyboardDidHide', e);
  },

  setupListeners(listeners) {
    listeners.forEach(listener => {
      window.addEventListener(listener.name, listener.fn, true);
      this._listeners.pushObject(listener);
    });
  },

  teardownListeners() {
    const listeners = copy(this._listeners); // cache for iterator manipulation

    listeners.forEach(listener => {
      window.removeEventListener(listener.name, listener.fn, true);
      this._listeners.removeObject(listener);
    });
  },
});
