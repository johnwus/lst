# Let's Talk - Real-Time Discussion PWA

## Overview

Full-stack PWA discussion platform with live topic rooms (27hr countdown), global room, mini-threads, explore/discover, notifications, and user profiles.

## Stack

- **Frontend**: React (plain JS) + Vite + Tailwind CSS + Radix UI, served on port 5173
- **Backend**: Node.js + Express + Socket.io + Mongoose, served on port 5000
- **Database**: MongoDB Atlas (`mongodb+srv://misterghod_db_user:...@lst-app.8ifdrn3.mongodb.net/`)
- **Monorepo**: pnpm workspaces
- **Node.js**: 18+

## Architecture

The application runs as a monorepo with two main packages:
- `/` → port 5173 (Vite dev server for React frontend)
- `/api` → port 5000 (Express + Socket.io backend)
- Socket.io connects directly to port 5000 for real-time communication

## Structure

```
backend/                         # Node.js backend
├── src/
│   ├── index.js                 # Express + Socket.io server
│   ├── socket.js                # Socket.io initialization
│   ├── config/
│   │   └── cloudinary.js        # Cloudinary image upload config
│   ├── jobs/
│   │   └── cleanup.js           # 27hr topic expiration jobs
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication (HTTP + Socket)
│   │   └── upload.js            # Multer file upload middleware
│   ├── models/
│   │   ├── User.js              # bcrypt password, followers/following
│   │   ├── Topic.js             # 27hr expiresAt, isGlobal flag
│   │   ├── Message.js           # reactions, threading, isGlobal
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js              # register, login, /me, update
│   │   ├── topics.js            # CRUD + join + participants
│   │   ├── messages.js          # CRUD + reactions + threads
│   │   ├── users.js             # follow/unfollow, profile
│   │   └── notifications.js
│   └── services/
│       └── notificationService.js  # Push notification service
└── .env                         # Backend environment config

frontend/                        # React + Vite frontend
├── src/
│   ├── App.jsx                  # Main router (wouter)
│   ├── main.jsx                 # Entry point
│   ├── index.css                # Global styles + Tailwind
│   ├── context/
│   │   ├── AuthContext.jsx     # JWT auth state + socket init
│   │   ├── OverlayContext.jsx   # UI overlay state
│   │   └── ThreadContext.jsx    # Thread panel state
│   ├── lib/
│   │   ├── api.js               # Axios fetch client
│   │   ├── socket.js            # Socket.io client
│   │   ├── sounds.js            # Notification sounds
│   │   └── navigation.js        # Navigation history hook
│   ├── hooks/
│   │   ├── useMessages.js       # Message fetching + real-time
│   │   ├── usePushNotifications.js # Web Push notifications
│   │   ├── usePWA.js            # PWA installation
│   │   ├── useQueries.js        # TanStack Query hooks
│   │   └── useScrollUnread.js   # Unread message tracking
│   ├── pages/
│   │   ├── Splash.jsx           # Splash/loading screen
│   │   ├── Auth.jsx             # Login / register
│   │   ├── LiveRoom.jsx         # Home: today's featured topic
│   │   ├── TopicRoom.jsx        # Live topic discussion room
│   │   ├── GlobalRoom.jsx       # Global chat (via TopicRoom)
│   │   ├── Explore.jsx          # Browse + create topics
│   │   ├── Threads.jsx          # Your threads
│   │   ├── ThreadRoom.jsx       # Full thread view
│   │   ├── Notifications.jsx     # Notifications page
│   │   ├── Profile.jsx          # User profile + settings
│   │   └── not-found.jsx        # 404 page
│   └── components/
│       ├── Layout.jsx           # Desktop sidebar + mobile bottom nav
│       ├── MessageCard.jsx      # Message with reactions/threading
│       ├── MessageInput.jsx     # Message input with emoji picker
│       ├── ThreadPanel.jsx      # Floating thread panel (desktop)
│       ├── ThreadRoom.jsx       # Full thread view overlay
│       ├── CreateTopicModal.jsx # Create new topic modal
│       ├── Avatar.jsx           # User avatar component
│       ├── PWAInstallBanner.jsx # PWA install prompt
│       ├── ShareScreen.jsx      # Share modal
│       └── UI components (Radix UI based)
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   └── favicon.svg              # App icon
└── vite.config.ts               # Vite configuration
```

## Running the Application

### Prerequisites
- Node.js 18+
- pnpm (required by monorepo)
- MongoDB Atlas connection string

### Installation
```bash
pnpm install
```

### Development
Run both backend and frontend concurrently:

**Terminal 1 - Backend:**
```bash
cd backend && pnpm dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend && pnpm dev
# Runs on http://localhost:5173
```

### Production Build
```bash
pnpm build
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Design System

- Dark teal background: `#1a3a3a` / `#0f2d2d`
- Green accent (CTAs): `#22c55e` / gradient green→teal
- Purple accent (active nav, secondary): `#9333ea`
- Mobile: bottom nav bar, full-screen rooms
- Desktop: 85px sidebar, content area with optional right panel

## Test Credentials

- **Email**: admin@letstalk.com | **Password**: admin123

## Key Features

- Live countdown timer on each topic (27hr window)
- Real-time messages via Socket.io
- Emoji reactions on messages
- Mini-thread overlays (floating glass panel on desktop)
- Category filtering (Society, Tech, Culture, Money)
- User follow system
- Push notification toggle
- PWA-ready (manifest + service worker)
- Image uploads via Cloudinary
- Global room for 24/7 discussions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update` - Update profile

### Topics
- `GET /api/topics` - List topics (with filters)
- `POST /api/topics` - Create topic
- `GET /api/topics/:id` - Get topic details
- `DELETE /api/topics/:id` - Delete topic
- `GET /api/topics/global` - Get global room topic
- `POST /api/topics/:id/join` - Join topic room

### Messages
- `GET /api/messages/:topicId` - Get messages for topic
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/reaction` - Add/remove reaction
- `GET /api/messages/thread/:messageId` - Get thread messages

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications` - Clear all
