# Let's Talk (LST) - Application Structure

This is the base application structure for the Let's Talk (LST) chat application.

## Git Repository Setup

### Clone the Repository

```bash
git clone https://github.com/johnwus/lst.git
cd lst
```

### Branch Naming Conventions

- `main` - Production-ready code (protected branch)
- `develop` - Integration branch for testing (protected branch)
- `feature/description` - New features (e.g., `feature/user-authentication`)
- `fix/description` - Bug fixes (e.g., `fix/login-redirect`)
- `hotfix/description` - Critical production fixes
- `refactor/description` - Code refactoring

### Workflow

1. Always pull latest changes before starting work:
 ```bash
git pull origin develop
```

2. Create a new branch from `develop`:
 ```bash
git checkout -b feature/your-feature-name
```

3. Make your changes and commit frequently:
```bash
git add .
git commit -m "Description of changes"
```

4. Push your branch and create a Pull Request:
 ```bash
git push origin feature/your-feature-name
```

5. After review, merge your PR into `develop`

## Project Overview

Let's Talk (LST) is a modern chat application that supports:
- One-on-one messaging
- Group chats (Mini Rooms)
- Global chat rooms
- Thread-based conversations
- User profiles and settings

## Directory Structure

```
lst/
├── frontend/                 # React Frontend Application
│   ├── public/              # Static public assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── screens/         # Page/Screen components
│   │   ├── services/        # API service modules
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Images, fonts, etc.
│   └── package.json         # Frontend dependencies
│
├── backend/                  # Node.js Backend API
│   └── src/
│       ├── controllers/     # Route controllers
│       ├── models/          # Database models (MongoDB)
│       ├── routes/          # API route definitions
│       ├── middleware/      # Express middleware
│       └── services/        # Business logic services
│   └── package.json         # Backend dependencies
│
└── README.md               # This file
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Routing**: React Router DOM
- **State Management**: React Context API / Redux
- **Styling**: CSS Modules / Tailwind CSS
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- pnpm (v8 or higher)

### Installation

1. **Clone the repository**

2. **Install frontend dependencies**
   ```bash
   cd lst/frontend
   pnpm install
   ```

3. **Install backend dependencies**
   ```bash
   cd lst/backend
   pnpm install
   ```

4. **Configure environment variables**
   - Create `.env` file in `lst/backend/`
   - Add necessary environment variables (DB connection, JWT secret, etc.)

### Running the Application

1. **Start the backend server**
   ```bash
   cd lst/backend
   pnpm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd lst/frontend
   pnpm start
   ```

## Project Phases

This application will be developed in multiple phases:
1. **Phase 1**: Core messaging functionality
2. **Phase 2**: User authentication and profiles
3. **Phase 3**: Room management (Mini Rooms, Global Rooms)
4. **Phase 4**: Thread conversations
5. **Phase 5**: Notifications and settings

## Contributing

Please follow the project's coding standards and guidelines when contributing.

## License

MIT License
