# 🌸 Japanese Study Planner - Project Documentation & Complete Code Structure

## 1. Project Overview & Objectives
- **Application Name:** Japanese Study Planner & LMS (ဂျပန်စာ လေ့လာမှု စီမံစနစ်)
- **Target Audience:** Japanese learners from N5 to N1 levels.
- **Core Features:** 
  - Google Sign-In & Authentication (OAuth 2.0 / Firebase Auth)[cite: 15]
  - Role-Based Access Control (Admin, Teacher, Student)[cite: 15]
  - Rich Multi-language Dictionary & Study Planner[cite: 15]
  - Interactive Q&A / Quiz Module & Question Bank[cite: 15]
  - Data Backup & Restore via User's Google Drive API[cite: 15]
- **Tech Stack:** React Native, Expo, Firebase (Auth, Firestore, Hosting), Google Drive API.[cite: 14, 15]

## 2. Project File Structure
```text
my-app/
├── App.js                         # Main Navigation Container & Bottom Tabs
├── components/
│   ├── AuthScreen.js              # Login & Register with Google Auth / Firebase
│   ├── DictionaryScreen.js        # Dictionary UI (Search, CRUD, JSON Import/Export)
│   ├── PlannerScreen.js           # Full Calendar & Time Slot Planner
│   ├── NotesScreen.js             # User Notes Module
│   ├── QAScreen.js                # Quiz & Q&A Module
│   ├── TeacherScreen.js           # Admin / Teacher Panel & RBAC
│   └── dictionaryData/            # Modularized Dictionary Database
│       ├── n5_nouns.js
│       ├── n5_verbs.js
│       ├── n3_advanced.js
│       ├── n2_words.js
│       ├── n1_words.js
│       └── index.js
```[cite: 14, 15, 20]