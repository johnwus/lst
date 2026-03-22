# PROJECT PROPOSAL: LET'S TALK (LST)

## 1.0 INTRODUCTION

### 1.1 Overview
"Let’s Talk" (LST) is a next-generation social web application designed to reintroduce authenticity to digital communication. In a landscape dominated by algorithmic distractions, LST offers a premium, "Midnight Glass" aesthetic environment focused on fleeting, meaningful interactions through ephemeral "Live Topics" and organized "Mini-Threads."

### 1.2 Problem Statement
Modern social platforms suffer from:
*   **Permanence Paradox:** The pressure of permanent feeds discourages spontaneous, authentic sharing.
*   **Visual Clutter:** Interfaces overcrowded with ads and irrelevant content features.
*   **Fragmented Conversations:** Difficulty in following specific discussions within large group chats.

LST addresses this by introducing a "Live Topic" system where conversations have a natural lifecycle, ensuring content remains fresh and engaging without the pressure of permanence.

### 1.3 Project Objectives
*   **Visual Excellence:** To implement a high-fidelity "Midnight Glass" UI with smooth transitions, blurred backdrops, and interactive micro-animations.
*   **Ephemeral Engagement:** To develop a "Live Room" architecture where topics auto-expire (e.g., 27-hour lifecycles), encouraging immediate participation.
*   **Cross-Platform PWA:** To deliver a native-app-like experience via a Progressive Web App that works seamlessly across Desktop, Tablet, and Mobile.

---

## 2.0 PROPOSED SOLUTION: "THE MIDNIGHT GLASS EXPERIENCE"

### 2.1 Core Features & Modules
The application is structured around five key modules, as demonstrated in the design prototype:

#### **I. Live Topics & Rooms**
*   **Ephemeral Topic Cards:** Dynamic topic rooms that feature countdown timers (e.g., 27h limit), creating a sense of urgency and activity.
*   **Global Room:** A persistent, application-wide common area for casual, real-time community interaction.
*   **Rich Media Headers:** Topics feature immersive visual headers with support for audio/video contexts.

#### **II. Intelligent Messaging System**
*   **Mini-Threads:** A sophisticated threading architecture that allows side-conversations to bloom without cluttering the main chat stream.
*   **Desktop Overlays:** A specialized desktop view where thread rooms open in "floating glass overlays," allowing users to multitask between the main feed and active discussions.
*   **Rich Interactions:** A comprehensive suite of expressive tools including GIF integration, "Sparkle" stickers, and multi-reaction hearts.

#### **III. Discovery & Alerts**
*   **Explore Module:** A categorized discovery engine for finding active communities.
*   **Smart Alerts:** A granular notification center that distinguishes between Mentions, Replies, Followers, and System announcements using distinct color-coded iconography (e.g., Emerald for Follows, Sky Blue for Mentions).

#### **IV. Profile & Identity**
*   **Identity System:** User profiles featuring avatar management and status indicators.
*   **Follower Ecosystem:** A streamlined connections model focusing on "Followers" and "Following" counts to build community rep.

### 2.2 UI/UX Design Philosophy
The interface mimics the premium feel of native OS environments:
*   **Aesthetic:** Dark-mode first ("Midnight"), utilizing deep navy/black gradients (`#020617`).
*   **Glassmorphism:** Heavy use of `backdrop-filter: blur` for deep, layered UI depth.
*   **Micro-Interactions:** Subtle animations on hover, active states, and modal entries to make the app feel "alive."

---

## 3.0 TECHNICAL ARCHITECTURE (PWA)

*   **Frontend methodology:** Mobile-First implementation with specific desktop responsiveness (e.g., "Thread Room Overlay").
*   **Service Worker:** For offline capabilities and asset caching.
*   **Responsive Layout:**
    *   *Mobile:* Bottom navigation bar (`nav-item`).
    *   *Desktop:* Adaptive layouts where content expands and utilizes available screen real estate.

---

## 4.0 PROJECT PLAN (5 WEEKS)

| Phase | Focus | Deliverables |
| :--- | :--- | :--- |
| **Week 1** | **Design & Foundation** | "Midnight Glass" Design System implementation, App Shell, PWA Manifest. |
| **Week 2** | **Core UI Construction** | Building the Live Topic Card components, Global Room Modal, and Navigation architecture. |
| **Week 3** | **Logic & Data** | Integrating Real-time Chat logic, Threading data structures, and User Auth. |
| **Week 4** | **Interactivity** | Implementing Reactions, GIF support, and "Desktop Overlay" mechanics. |
| **Week 5** | **Polish & Deploy** | Micro-animation refinement, Performance optimization, Final PWA Deployment. |

---

## 5.0 TEAM COMPOSITION

| No. | Team Member | Role | Focus Area |
| :-- | :--- | :--- | :--- |
| 1 | **Gyan Appiah-Twene** (8999423) | Project Manager | Timeline & Scope Management |
| 2 | **Eugene, Sie Kofi** (5311720) | UI/UX Designer | Visual Language & "Glass" System |
| 3 | **Asamoah David** | UI/UX Designer | Component Prototyping |
| 4 | **Ampofo Kwadwo Boateng** (8994023) | Frontend Dev | Topic & Room Interfaces |
| 5 | **Quarcoo Daniel Derek Nii Kwei** (9040123) | Frontend Dev | Messaging & Thread Logic |
| 6 | **David Agbebo** (8985123) | Frontend Dev | Responsive Layouts |
| 7 | **Yaa Lartebea Lartey** (9025723) | Frontend Dev | Profile & Settings Modules |
| 8 | **Benjamin Ettey** (9018823) | Full Stack | API & Data Integration |
| 9 | **Asare Kwaku Boadu Lancelot** (9003023) | Backend Dev | Server Logic & Database |
| 10 | **Owusu John** (9038423) | QC / Tester | Usability Testing |
| 11 | **Dzukey Prince Ofori** (90174231) | QC / Tester | Performance Testing |

---

## 6.0 CONCLUSION

"Let's Talk" is not just a social app; it is a design-forward, functional statement. By leveraging modern Web APIs to deliver a native-quality PWA experience, the project aims to set a new standard for student-led software development, prioritizing aesthetic beauty alongside functional utility.
