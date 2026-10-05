// components/AppHeader.js — စာမျက်နှာတိုင်း အပေါ်ဆုံး ခေါင်းစီး (တူညီမှု ရှိအောင်)
// [ခေါင်းစဉ်] [မြန်မာ|English|日本語] [profile pic + နာမည်] [🚪 logout]
// + action prop နဲ့ စာမျက်နှာအလိုက် ခလုတ် (ဥပမာ ➕) ထည့်လို့ရတယ်
import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Platform } from 'react-native';
import { useLanguage, LANGS } from '../src/LanguageContext';

export default function AppHeader({ title, user, onLogout, action, showLang = true }) {
  const { lang, setLang } = useLanguage();

  const initial = ((user && user.name) || 'U').trim().charAt(0).toUpperCase();

  return (
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {showLang && (
        <View style={styles.langRow}>
          {LANGS.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, lang === l.code && styles.langBtnActive]}
              onPress={() => setLang(l.code)}
            >
              <Text style={[styles.langText, lang === l.code && styles.langTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {action && <View style={styles.actionWrap}>{action}</View>}

      {user && (
        <View style={styles.profile}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>
            {user.name || 'User'}
          </Text>
        </View>
      )}

      {onLogout && (
        <TouchableOpacity
          onPress={onLogout}
          style={styles.logoutBtn}
          accessibilityLabel="Logout"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 16 }}>🚪</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
    fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif',
  },
  langRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  langBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    marginLeft: 3,
    backgroundColor: '#FFF',
  },
  langBtnActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  langText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  langTextActive: {
    color: '#FFF',
  },
  actionWrap: {
    marginRight: 6,
    justifyContent: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    maxWidth: 130,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EEE',
  },
  avatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  name: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    maxWidth: 85,
  },
  logoutBtn: {
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
  },
});
