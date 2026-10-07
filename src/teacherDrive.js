// src/teacherDrive.js — TEACHER-only direct upload to their own Drive (e.g. 100GB Gmail)
// Scope: drive.file (app-created files only — teacher's other files untouched).
// Flow: connect (teacher's Gmail) → ensure "MKS Materials" folder (+Anyone reader)
// → pick file → upload → set Anyone-reader on file → return webViewLink.
// Students never see this (staff UI only). Quota/ownership = teacher's Drive account.
// NOTE: hook calls Google.useAuthRequest → mount ONLY when teacherDriveConfigured() true
// (else it throws at render — same lesson as student backup).
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const SHARED_FOLDER = 'MKS Materials';
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export function teacherDriveConfigured() {
  if (Platform.OS === 'android') return !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  if (Platform.OS === 'ios') return !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  return !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
}

// Same fixed redirect as student backup (Drive UI lives in Community + Materials modal
// navigates from Community-family screens; /community is always safe to land on).
// NOTE: MaterialsScreen upload button is reached from 📚 tab — after Google redirect
// the browser lands on /community. Teacher then re-opens 📚 (one tap). Acceptable.
export function getTeacherRedirectUri() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  return window.location.origin + '/community';
}

export function useTeacherDrive() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: getTeacherRedirectUri(),
    scopes: [FILE_SCOPE],
  });
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = response?.authentication?.accessToken;
    if (response?.type === 'success' && t) setToken(t);
  }, [response]);

  const headers = () => ({ Authorization: `Bearer ${token}` });

  const connect = async () => {
    await promptAsync({ useProxy: Platform.OS !== 'web' });
  };
  const disconnect = () => setToken(null);

  const api = async (path, opts = {}) => {
    const res = await fetch(`https://www.googleapis.com${path}`, {
      ...opts,
      headers: { ...(opts.headers || {}), ...headers() },
    });
    if (res.status === 401) {
      disconnect();
      throw new Error('auth-expired');
    }
    return res;
  };

  // "MKS Materials" folder: find or create + Anyone-reader share
  const ensureFolder = async () => {
    const q = encodeURIComponent(
      `name = '${SHARED_FOLDER}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const list = await api(`/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`);
    if (!list.ok) throw new Error('drive-list-' + list.status);
    const j = await list.json();
    let folderId = j.files && j.files[0] ? j.files[0].id : null;
    if (!folderId) {
      const created = await api('/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: SHARED_FOLDER, mimeType: 'application/vnd.google-apps.folder' }),
      });
      if (!created.ok) throw new Error('drive-mkdir-' + created.status);
      folderId = (await created.json()).id;
      await api(`/drive/v3/files/${folderId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      }).catch(() => {});
    }
    return folderId;
  };

  // file bytes → blob (XHR — base64 33% overhead မရှိ, ဖိုင်ကြီးအတွက်)
  const readAsBlob = (uri) =>
    new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () => {
          if (xhr.response) resolve(xhr.response);
          else reject(new Error('fetch-fail'));
        };
        xhr.onerror = () => reject(new Error('fetch-fail'));
        xhr.open('GET', uri, true);
        xhr.send(null);
      } catch (e) {
        reject(e);
      }
    });

  // file bytes → base64 (RN FileReader) → multipart upload (≤5MB only!)
  const readAsBase64 = (uri) =>
    new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () => {
          try {
            const reader = new FileReader();
            reader.onloadend = () => {
              const s = String(reader.result || '');
              const idx = s.indexOf('base64,');
              resolve(idx >= 0 ? s.slice(idx + 7) : '');
            };
            reader.onerror = () => reject(new Error('read-fail'));
            reader.readAsDataURL(xhr.response);
          } catch (e) {
            reject(e);
          }
        };
        xhr.onerror = () => reject(new Error('fetch-fail'));
        xhr.open('GET', uri, true);
        xhr.send(null);
      } catch (e) {
        reject(e);
      }
    });

  const shareFileAnyone = async (fileId) => {
    // Anyone-with-link on the file itself (bulletproof even if folder share changes)
    await api(`/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }).catch(() => {});
  };

  const multipartUpload = async (meta, uri) => {
    const b64 = await readAsBase64(uri);
    if (!b64) return { error: 'read-fail' };
    const boundary = '-------mks_upload_' + Date.now();
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(meta) +
      `\r\n--${boundary}\r\nContent-Type: ${meta.mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
      b64 +
      `\r\n--${boundary}--`;
    const up = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (up.status === 401) {
      disconnect();
      return { expired: true };
    }
    if (!up.ok) return { error: 'drive-up-' + up.status };
    return { ok: true, file: await up.json() };
  };

  // Resumable upload (>5MB — multipart က Google limit 5MB, ကျော်ရင် "Invalid upload request")
  const resumableUpload = async (meta, uri) => {
    const init = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,webViewLink,size', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(meta),
    });
    if (init.status === 401) {
      disconnect();
      return { expired: true };
    }
    if (!init.ok) return { error: 'drive-up-' + init.status };
    const sessionUri = init.headers.get('location');
    if (!sessionUri) return { error: 'no-session' };
    const blob = await readAsBlob(uri);
    const put = await fetch(sessionUri, {
      method: 'PUT',
      headers: { ...headers() },
      body: blob,
    });
    if (put.status === 401) {
      disconnect();
      return { expired: true };
    }
    if (!(put.status === 200 || put.status === 201)) return { error: 'drive-up-' + put.status };
    return { ok: true, file: await put.json() };
  };

  const uploadPicked = async (picked /* {uri,name,mimeType,size} */) => {
    if (!token) return { needAuth: true };
    if (picked.size && picked.size > MAX_UPLOAD_BYTES) return { error: 'too-big' };
    setBusy(true);
    try {
      const folderId = await ensureFolder();
      const meta = {
        name: picked.name || 'material',
        parents: [folderId],
        mimeType: picked.mime || 'application/octet-stream',
      };
      // 5MB+ → resumable (multipart rejects with "Invalid upload request")
      const big = picked.size && picked.size > 5 * 1024 * 1024;
      const r = big ? await resumableUpload(meta, picked.uri) : await multipartUpload(meta, picked.uri);
      if (!r.ok) return r;
      await shareFileAnyone(r.file.id);
      return { ok: true, file: r.file };
    } catch (e) {
      return { error: String((e && e.message) || e) };
    } finally {
      setBusy(false);
    }
  };

  return {
    connected: !!token, busy, ready: !!request,
    connect, disconnect, ensureFolder, uploadPicked,
  };
}

export function guessType(mime, name) {
  const m = (mime || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (m.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(n)) return 'video';
  if (m.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|mpga)$/.test(n)) return 'audio';
  return 'doc';
}
