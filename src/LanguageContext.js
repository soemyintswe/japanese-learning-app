// src/LanguageContext.js — App တစ်ခုလုံး ဘာသာစကား (မြန်မာ/English/日本語) တစ်နေရာတည်း
// စာမျက်နှာမှာ ပြောင်းရင် ကျန်စာမျက်နှာတွေပါ လိုက်ပြောင်းမယ် + ဖုန်းထဲမှာ မှတ်ထားမယ်
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANG_KEY = '@japanese_lang_v1';
const VALID = ['my', 'en', 'jp'];

const LanguageContext = createContext({ lang: 'my', setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('my');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved && VALID.includes(saved)) setLangState(saved);
      } catch (e) {}
    })();
  }, []);

  const setLang = (l) => {
    if (!VALID.includes(l)) return;
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

export const LANGS = [
  { code: 'my', label: 'မြန်မာ' },
  { code: 'en', label: 'English' },
  { code: 'jp', label: '日本語' },
];
