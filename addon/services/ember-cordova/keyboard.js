/* global cordova */
import Ember from 'ember';

const {
  A,
  Evented,
  RSVP,
  Service,
  inject,
  run
} = Ember;

const { Promise } = RSVP;
const KEYBOARD_ANIMATION_TIME = 300; //ms, guestimated from SO recommendations

export default Service.extend(Evented, {
  adjustBodyHeight: true,
  shouldDisableScroll: true,
  keyboardHeight: 0,

  _listeners: [],
  _height: null,

  init() {
    this._super();

    this._listeners = new A();
    this.keyboard().then(kb => { this.setup(kb); });
  },

  willDestroy() {
    this._super();
    this.teardownListeners();
  },

  _keyboard: null,
  keyboard() {
    if (this._keyboard) { return Promise.resolve(this._keyboard); }

    return new Promise((resolve) => {
      document.addEventListener("deviceready", () => {
        this._keyboard = window.cordova.plugins.Keyboard;
        resolve(this._keyboard);
      }, false);
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

    listeners.forEach(listener => {
      this._listeners.pushObject(listener);
      window.addEventListener(listener.name, listener.fn, true);
    });
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

  teardownListeners() {
    const listeners = this._listeners;

    listeners.forEach(listener => {
      window.removeEventListener(listener.name, listener.fn, true);
      this._listeners.removeObject(listener);
    });
  },
});
