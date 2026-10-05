// src/webAlertPolyfill.js — MUST import once in App.js
// Root cause fix: react-native-web's Alert.alert() is a NO-OP (static alert() {}),
// so every Alert-based confirm/error was silently doing NOTHING on web.app
// (admin approve buttons, delete confirms, login errors...).
// This maps Alert.alert → window.alert/confirm on web. Native untouched.
// Long-term: critical flows use in-app ConfirmModal; this is the safety net.
import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    const text = (title ? title + '\n\n' : '') + (message || '');
    try {
      if (!buttons || buttons.length === 0) {
        window.alert(text);
        return;
      }
      const cancel = buttons.find((b) => b && b.style === 'cancel');
      const others = buttons.filter((b) => b && b !== cancel);
      if (others.length === 0) {
        window.alert(text);
        if (cancel && cancel.onPress) cancel.onPress();
        return;
      }
      const ok = window.confirm(text);
      if (ok) {
        const chosen = others[others.length - 1];
        if (chosen && chosen.onPress) chosen.onPress();
      } else if (cancel && cancel.onPress) {
        cancel.onPress();
      }
    } catch (e) {
      // iframe/blocked dialogs — fail silently like before
    }
  };
}

export {};
