# ဂျပန်စာ လေ့လာမှု စီမံစနစ် (Japanese Study Planner & LMS)

## 📌 အဓိက လုပ်ဆောင်ချက်များ (Features)
* **Google Sign-In (OAuth 2.0):** သီးသန့် Username/Password မှတ်စရာမလိုဘဲ Gmail အကောင့်ဖြင့် လွယ်ကူလျင်မြန်စွာ ဝင်ရောက်နိုင်ခြင်း။[cite: 15]
* **Role-Based Access Control (RBAC):**[cite: 15]
  * **Super Admin / Admin:** အကောင့်များကို စီမံခန့်ခွဲခြင်း (အသုံးပြုခွင့်ပေးခြင်း၊ ရပ်နားခြင်း၊ ဖျက်သိမ်းခြင်း) နှင့် Roles များ သတ်မှတ်ပေးခြင်း။[cite: 15]
  * **Teacher (ဆရာ):** မေးခွန်းများ ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်း၊ တည်းဖြတ်ခြင်း (Question Bank & Quiz Management) လုပ်ပိုင်ခွင့်များ။[cite: 15]
  * **Student (ကျောင်းသား):** မေးခွန်းများ ဖြေဆိုခြင်း၊ လေ့လာမှုမှတ်တမ်းများနှင့် Planner ကို အသုံးပြုခြင်း။[cite: 15]
* **Local & Cloud Backup (Google Drive Integration):** အသုံးပြုသူ၏ ကိုယ်ပိုင် Google Drive သို့ ဒေတာများ Backup တင်ခြင်းနှင့် ပြန်လည်ဆွဲယူခြင်း (Restore) ပြုလုပ်နိုင်စနစ်။ Device အပြောင်းအလဲလုပ်သည့်အခါ ဒေတာမဆုံးရှုံးစေရန် ကာကွယ်ပေးသည်။[cite: 15]
* **Multi-Language Support:** မြန်မာ၊ အင်္ဂလိပ်နှင့် ဂျပန်ဘာသာစကားများဖြင့် အသုံးပြုနိုင်ခြင်း။[cite: 15]

## 🛠️ နည်းပညာ အသုံးပြုမှုများ (Tech Stack)
* **Frontend:** React Native / React, Expo, Web Technologies[cite: 15]
* **Backend & Database:** Firebase Authentication, Firestore Database, Firebase Hosting (`japanese-mksedu.web.app`)[cite: 14, 15]
* **Storage & Security:** Local Storage / IndexedDB, Google Drive API, .gitignore (Secret Keys ကာကွယ်ရန်)[cite: 15, 19]
```[cite: 14, 15, 19, 20]