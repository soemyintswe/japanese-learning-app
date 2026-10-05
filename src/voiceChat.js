// src/voiceChat.js — voice record/playback, platform-split for reliability
// Web: native MediaRecorder + HTMLAudio (expo-av/expo-file-system web paths are fragile).
// Native (Expo Go/phone): expo-av Recording + Sound (proven path).
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export const isWeb = () => Platform.OS === 'web';
const HTMLAudioEl = typeof window !== 'undefined' ? window.Audio : null;

export async function requestMic() {
  if (isWeb()) {
    if (!navigator?.mediaDevices?.getUserMedia) throw new Error('no-mic-api');
    // Real browser mic prompt (expo's permission query can silently mis-report)
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach((tr) => tr.stop());
    return true;
  }
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) throw new Error('no-permission');
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  return true;
}

function pickWebMime() {
  try {
    if (typeof MediaRecorder === 'undefined') return '';
    const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const c of cands) {
      try {
        if (MediaRecorder.isTypeSupported(c)) return c;
      } catch (e) {}
    }
  } catch (e) {}
  return '';
}

// → handle { stop(): Promise<{blob, url, durationMs, mime}> }
export async function startRecording() {
  if (isWeb()) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickWebMime();
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    const t0 = Date.now();
    mr.start(250);
    return {
      kind: 'web',
      stop: () =>
        new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            try {
              const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
              const url = URL.createObjectURL(blob);
              resolve({ blob, url, durationMs: Date.now() - t0, mime: blob.type || 'audio/webm' });
            } catch (e) {
              resolve({ blob: null, url: '', durationMs: 0, mime: '' });
            } finally {
              try {
                stream.getTracks().forEach((tr) => tr.stop());
              } catch (e) {}
            }
          };
          mr.onstop = finish;
          try {
            mr.stop();
          } catch (e) {
            finish();
          }
          // safety: never hang
          setTimeout(finish, 1500);
        }),
    };
  }
  const rec = new Audio.Recording();
  await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
  await rec.startAsync();
  const t0 = Date.now();
  return {
    kind: 'native',
    stop: async () => {
      try {
        await rec.stopAndUnloadAsync();
      } catch (e) {}
      let uri = null;
      try {
        uri = rec.getURI();
      } catch (e) {}
      if (!uri) return { blob: null, url: '', durationMs: 0, mime: '' };
      try {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        return { blob, url: uri, durationMs: Date.now() - t0, mime: blob.type || '' };
      } catch (e) {
        return { blob: null, url: '', durationMs: 0, mime: '' };
      }
    },
  };
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    try {
      const r = new FileReader();
      r.onloadend = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('read-fail'));
      r.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

// Play a URL (object/data/http/file). → { stop }
export async function playUrl(url, onDone, onError) {
  if (isWeb()) {
    if (!HTMLAudioEl) {
      if (onError) onError();
      return { stop: () => {} };
    }
    try {
      const el = new HTMLAudioEl(url);
      el.onended = () => {
        if (onDone) onDone();
      };
      el.onerror = () => {
        if (onError) onError();
      };
      await el.play();
      return {
        stop: () => {
          try {
            el.pause();
          } catch (e) {}
          if (onDone) onDone();
        },
      };
    } catch (e) {
      if (onError) onError();
      return { stop: () => {} };
    }
  }
  try {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    } catch (e) {}
    const { sound } = await Audio.Sound.createAsync({ uri: url });
    sound.setOnPlaybackStatusUpdate((st) => {
      if (st.didJustFinish && onDone) onDone();
    });
    await sound.playAsync();
    return {
      stop: async () => {
        try {
          await sound.unloadAsync();
        } catch (e) {}
      },
    };
  } catch (e) {
    if (onError) onError();
    return { stop: () => {} };
  }
}
