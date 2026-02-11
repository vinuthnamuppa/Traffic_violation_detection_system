# Traffic Violation System - React Frontend

Modern React frontend for the AI-Driven Traffic Violation Detection System.

## Tech Stack

- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **JWT** authentication

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm/yarn installed
- Backend Flask server running on `http://localhost:5000`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend-spa
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Features

- **Landing Page**: Public homepage with project information
- **Authentication**: Login and registration with role selection (Public User / Traffic Officer)
- **User Dashboard**: View challans and make payments
- **Officer Dashboard**: Manage violations, create/edit/delete challans

## API Integration

The frontend communicates with the Flask backend API:
- `/api/auth/*` - Authentication endpoints
- `/api/challans/*` - Challan management endpoints
- `/api/violations` - Violation viewing endpoints

All API calls are proxied through Vite dev server (see `vite.config.js`).
