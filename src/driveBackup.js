// src/driveBackup.js — ကိုယ့် Google Drive (appDataFolder) backup/restore
// Setup (owner, once): Google Cloud Console → OAuth client IDs → .env:
//   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (+ ANDROID/IOS for native builds)
//   Authorized origin (web): https://japanese-mksedu.web.app (+ http://localhost:8081 for dev)
//   Scopes: drive.appdata only (hidden app folder — user's Drive မရှုပ်ဘူး)
//   Testing mode: add tester emails (verification မလိုဘူး, ≤100 users OK)
// Token: in-memory only (1hr); 401 → reconnect prompt. No refresh plumbing (v1 scope).
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export const BACKUP_KEYS = [
  '@japanese_planner_v1',
  '@japanese_notes_v1',
  '@japanese_dict_custom_v1',
  '@japanese_qa_custom_v1',
  '@japanese_quiz_progress_v1',
  '@japanese_lang_v1',
];

export function driveIdForPlatform() {
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
}

// Platform-appropriate ID only — wrong-platform IDs make Google.useAuthRequest THROW at render.
// (web needs WEB id, native needs its own; missing → setup notice, never a blank screen)
export function driveConfigured() {
  return !!driveIdForPlatform();
}

// Web redirect MUST be exact (Google matches exactly):
// Drive buttons live ONLY in Community/Profile (/community) → always return there.
// Owner registers EXACTLY this URL in Google Cloud Console (prod + localhost dev).
export function getDriveRedirectUri() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  return window.location.origin + '/community';
}

export function useDriveBackup(user) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: getDriveRedirectUri(),
    scopes: [APPDATA_SCOPE],
  });
  const [accessToken, setAccessToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  useEffect(() => {
    if (response?.type === 'success') {
      const t = response.authentication?.accessToken;
      if (t) {
        setAccessToken(t);
        refreshLast(t);
      }
    }
  }, [response]);

  const headers = (t) => ({ Authorization: `Bearer ${t || accessToken}` });

  const refreshLast = async (t) => {
    try {
      const q = encodeURIComponent("name contains 'japanese-backup'");
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=appDataFolder&orderBy=modifiedTime desc&pageSize=1&fields=files(id,name,modifiedTime,size)`,
        { headers: headers(t) }
      );
      if (!res.ok) return;
      const j = await res.json();
      if (j.files && j.files[0]) setLastBackup(j.files[0]);
    } catch (e) {}
  };

  const connect = async () => {
    try {
      await promptAsync({ useProxy: Platform.OS !== 'web' });
    } catch (e) {
      throw e;
    }
  };

  const disconnect = () => {
    setAccessToken(null);
    setLastBackup(null);
  };

  const backupNow = async () => {
    if (!accessToken) return { needAuth: true };
    setBusy(true);
    try {
      const data = {};
      for (const k of BACKUP_KEYS) {
        try {
          data[k] = await AsyncStorage.getItem(k);
        } catch (e) {
          data[k] = null;
        }
      }
      const payload = JSON.stringify({
        app: 'JapaneseStudyPlanner-backup', version: 1,
        uid: user?.uid, email: user?.email,
        exportedAt: new Date().toISOString(), data,
      });
      const meta = {
        name: `japanese-backup-${new Date().toISOString().slice(0, 10)}.json`,
        parents: ['appDataFolder'], mimeType: 'application/json',
      };
      const boundary = '-------japanese_backup_' + Date.now();
      const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(meta) +
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        payload +
        `\r\n--${boundary}--`;
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      });
      if (res.status === 401) {
        disconnect();
        return { expired: true };
      }
      if (!res.ok) return { error: 'drive-' + res.status };
      await refreshLast();
      return { ok: true };
    } catch (e) {
      return { error: String(e.message || e) };
    } finally {
      setBusy(false);
    }
  };

  const fetchLatest = async () => {
    const q = encodeURIComponent("name contains 'japanese-backup'");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=appDataFolder&orderBy=modifiedTime desc&pageSize=1&fields=files(id,name,modifiedTime)`,
      { headers: headers() }
    );
    if (res.status === 401) {
      disconnect();
      return { expired: true };
    }
    if (!res.ok) return { error: 'drive-' + res.status };
    const j = await res.json();
    if (!j.files || !j.files[0]) return { empty: true };
    const dl = await fetch(`https://www.googleapis.com/drive/v3/files/${j.files[0].id}?alt=media`, {
      headers: headers(),
    });
    if (!dl.ok) return { error: 'drive-dl-' + dl.status };
    const backup = await dl.json();
    if (!backup || backup.app !== 'JapaneseStudyPlanner-backup' || !backup.data) {
      return { error: 'bad-file' };
    }
    return { ok: true, file: j.files[0], backup };
  };

  const restoreNow = async (backup) => {
    setBusy(true);
    try {
      const pairs = BACKUP_KEYS.filter((k) => backup.data[k] != null).map((k) => [k, backup.data[k]]);
      if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
      return { ok: true, count: pairs.length };
    } catch (e) {
      return { error: String(e.message || e) };
    } finally {
      setBusy(false);
    }
  };

  return {
    configured: driveConfigured(),
    ready: !!request,
    connected: !!accessToken,
    busy, lastBackup,
    connect, disconnect, backupNow, fetchLatest, restoreNow, refreshLast,
  };
}
