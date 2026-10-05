// components/ConfirmModal.js — in-app confirm/info dialog (works on web + native)
// Props: visible, title, message, confirmText (null → info mode, single OK),
//        cancelText, danger, busy, onConfirm, onCancel
import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';

export default function ConfirmModal({
  visible, title, message, confirmText, cancelText, danger, busy, onConfirm, onCancel,
}) {
  const infoMode = !confirmText;
  return (
    <Modal visible={!!visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.row}>
            {!infoMode && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
                <Text style={styles.cancelText}>{cancelText || 'Cancel'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.okBtn, danger && styles.dangerBtn, infoMode && styles.fullBtn]}
              onPress={infoMode ? onCancel : onConfirm}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.okText}>{infoMode ? (cancelText || 'OK') : confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 24 },
  box: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, elevation: 5 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 13, color: '#444', lineHeight: 19, marginBottom: 14, textAlign: 'center' },
  row: { flexDirection: 'row' },
  cancelBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#E0E0E0', borderRadius: 8, alignItems: 'center', marginRight: 6 },
  cancelText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
  okBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#1976D2', borderRadius: 8, alignItems: 'center', marginLeft: 6 },
  dangerBtn: { backgroundColor: '#D32F2F' },
  fullBtn: { marginLeft: 0 },
  okText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});
