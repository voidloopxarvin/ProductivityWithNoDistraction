<div align="center">

# 🔒 PrepLock - Productivity With No Distraction

### Multi-Platform Productivity Suite Built on the **PREP** Framework

[![JavaScript](https://img.shields.io/badge/JavaScript-91.8%25-yellow?style=flat&logo=javascript)](https://github.com/voidloopxarvin/ProductivityWithNoDistraction)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-Mobile-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat&logo=node.js)](https://nodejs.org/)

[About PREP](#-the-prep-framework) • [Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Screenshots](#-screenshots)

</div>

---

## 🎯 The PREP Framework

PrepLock is built on the **PREP** philosophy - a holistic approach to productivity:

| **P** | **R** | **E** | **P** |
|-------|-------|-------|-------|
| **Productivity** | **Restraint** | **Engagement** | **Protection** |
| Boost your efficiency by focusing on meaningful tasks and working smarter | Hold back distractions, avoid multitasking, and minimize interruptions | Stay actively connected with your goals to maintain momentum and flow | Safeguard your focus by setting boundaries and creating a distraction-free zone |

> *"PrepLock helps you PREP for success by combining smart task management with intelligent distraction blocking."*

---

## 📌 About PrepLock

**PrepLock** is a comprehensive productivity platform that implements the PREP framework across three seamlessly integrated platforms - helping students and professionals eliminate distractions and maximize focus.

**Why PrepLock?**
- 🚫 **Smart Distraction Blocking** - No social media until tasks are done
- 🤖 **AI-Powered Learning** - Auto-generate flashcards, study roadmaps, and get AI mentoring
- 📱 **Multi-Platform Sync** - Chrome Extension, Web Dashboard, and Mobile App
- 📊 **Progress Tracking** - Mock tests, quizzes, and detailed analytics
- 🎯 **Goal-Based Access** - Unlock entertainment only after completing your tasks

---

## 📁 Project Structure

```
ProductivityWithNoDistraction/
│
├── 📱 CLIENT/                      # Web Dashboard
│   ├── 📂 src/
│   │   ├── 🧩 components/
│   │   ├── 📄 pages/
│   │   └── 🛠️ utils/
│   └── 📦 package.json
│
├── 🔌 EXTENSION/                   # Chrome Extension
│   ├── 🚫 blocked/
│   ├── 🎨 popup/
│   ├── ⚙️ background.js
│   └── 📋 manifest.json
│
├── 📱 MOBILE/                      # React Native App
│   ├── 🤖 android/
│   ├── 🍎 ios/
│   ├── 📂 src/
│   │   ├── ⚙️ config/
│   │   ├── 🧭 navigation/
│   │   └── 🔗 services/
│   └── 📱 App.tsx
│
└── 🖥️ SERVER/                      # Backend API
    ├── 🎮 Controllers/
    ├── 📊 models/
    ├── 🛣️ routes/
    └── 🚀 server.js
```


### 🗂️ Folder Descriptions

#### **CLIENT/** - Web Dashboard (React.js)
- **Purpose**: Main web interface for comprehensive task management
- **Key Files**:
  - `src/components/` - Reusable UI components
  - `src/pages/` - Dashboard, AI tools, analytics pages
  - `src/utils/` - Helper functions and API calls

#### **EXTENSION/** - Chrome Extension
- **Purpose**: Browser-based distraction blocker and quick task access
- **Key Files**:
  - `background.js` - Extension background service worker
  - `manifest.json` - Extension configuration
  - `popup/` - Extension popup interface
  - `blocked/` - Blocked website redirect page
  - `options/` - Extension settings page

#### **MOBILE/** - React Native App
- **Purpose**: Mobile productivity tracking and on-the-go access
- **Key Files**:
  - `src/screens/` - App screens (Home, Tasks, AI Tools)
  - `src/navigation/` - React Navigation setup
  - `src/services/` - API integration and services
  - `android/` & `ios/` - Native platform code

#### **SERVER/** - Backend (Node.js + Express)
- **Purpose**: RESTful API, authentication, and database operations
- **Key Files**:
  - `Controllers/` - Route controllers for business logic
  - `models/` - MongoDB schemas (User, Task, BlockedSite)
  - `routes/` - API endpoint definitions
  - `middlewares/` - Authentication, validation middleware
  - `services/` - External API integrations (Gemini AI)
  - `server.js` - Express server entry point

---

## ✨ Features

### 🔐 Intelligent Distraction Blocker (Restraint)
- Block time-wasting websites until you complete your daily tasks
- Synchronized blocking across browser extension and mobile app
- Customizable block lists with whitelist options
- Can't bypass or uninstall until tasks are done

### 📈 Productivity Boosters (Productivity)
- Smart task management with priorities and deadlines
- Daily productivity goals and tracking
- Time-blocking and schedule optimization
- Progress analytics and insights

### 🎯 Active Engagement (Engagement)
- Mock tests and quizzes to stay connected with learning
- Real-time progress updates across devices
- Achievement system and milestone tracking
- Daily streaks and productivity scores

### 🛡️ Focus Protection (Protection)
- Create distraction-free study/work zones
- Scheduled focus sessions with break reminders
- Mobile app distraction blocker
- Social media detox mode

### 🧠 AI-Powered Study Tools
- **Flashcard Generator**: Upload PDFs and auto-generate study flashcards
- **Study Planner**: Personalized schedules based on goals
- **AI Mentor**: Chat with AI for homework help
- **Visual Roadmaps**: Mermaid diagram-based learning paths

---

## 🛠️ Tech Stack

**Frontend:**
- React.js 18 (Web Dashboard)
- React Native 0.72+ (Mobile App)
- Chrome Extension API (Manifest V3)
- Tailwind CSS / Styled Components

**Backend:**
- Node.js 16+
- Express.js
- RESTful APIs
- JWT Authentication

**Database:**
- MongoDB Atlas
- Mongoose ODM

**AI Integration:**
- Google Gemini API
- Mermaid.js for diagrams

**Mobile:**
- React Native
- React Navigation
- AsyncStorage
- React Native Paper

---

## 📸 Screenshots

> **📁 Create `/screenshots` folder in root directory**

### Web Dashboard
![Dashboard] <img width="1326" height="1077" alt="image" src="https://github.com/user-attachments/assets/d65bdc81-b8eb-48a7-ac71-450df3668a82" />

*Task management with PREP framework visualization*

### Chrome Extension
![Extension] <img width="882" height="849" alt="image" src="https://github.com/user-attachments/assets/8522480e-975e-47e8-9daf-48043c394797" />
<img width="783" height="854" alt="image" src="https://github.com/user-attachments/assets/5433db4b-3118-48aa-bfea-c0bced9a8015" />

*Quick access popup with task status*

![Blocked Page] <img width="1919" height="1199" alt="image" src="https://github.com/user-attachments/assets/1909ef35-14ad-44dc-84fa-6e56ceac834e" />

*Custom blocked website redirect page*

### Mobile App
<div align="center">
    ![finalll](https://github.com/user-attachments/assets/94f18b55-4395-4dee-adf4-fd8446fa3a88)

![blocki](https://github.com/user-attachments/assets/af6bffc1-c159-4cae-bf92-c37dbdc09e18)

![syllab](https://github.com/user-attachments/assets/a4496168-77d1-4373-90b7-f8d2b9d849e7)
</div>

*Mobile app screens: Home, Tasks, and AI Tools*

### AI Features
![AI Flashcards]<img width="1537" height="1094" alt="image" src="https://github.com/user-attachments/assets/b340394c-4096-40e1-9e25-35e856863a3a" />

*Auto-generated flashcards from PDF upload*

![Study Roadmap]
<img width="1172" height="1072" alt="image" src="https://github.com/user-attachments/assets/2733f32a-0a7a-426b-b768-2387022614fd" />

<img width="1645" height="1094" alt="image" src="https://github.com/user-attachments/assets/b5d5bf37-18cf-4652-a865-38abb3188c20" />

*Mermaid diagram learning roadmap*

---

