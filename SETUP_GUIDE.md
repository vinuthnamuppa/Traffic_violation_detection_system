# Complete Setup Guide - AI-Driven Traffic Violation Detection System

This guide covers setting up the entire system: backend (Flask + MongoDB) and frontend (React).

## Prerequisites

- **Python 3.12** (recommended) or Python 3.11
- **Node.js 16+** and npm
- **MongoDB** (local installation or MongoDB Atlas)
- **Microsoft Visual C++ Redistributable 2015-2022 (x64)** (required for PyTorch on Windows)

## Part 1: Backend Setup

### 1.1 Install Python Dependencies

```bash
cd traffic_violation_system
python -m venv .venv

# Windows PowerShell (if execution policy allows):
.\.venv\Scripts\Activate.ps1

# Or Windows CMD:
.\.venv\Scripts\activate.bat

# Or Linux/Mac:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

### 1.2 Configure Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=traffic_violation_db
MONGODB_COLLECTION_VIOLATIONS=violations
MONGODB_COLLECTION_USERS=users
MONGODB_COLLECTION_CHALLANS=challans
MONGODB_COLLECTION_PAYMENTS=payments
MONGODB_COLLECTION_OFFICER_LOGS=officer_logs

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=86400

# AI Pipeline Configuration
SPEED_LIMIT_KMPH=60
STOP_LINE_Y=350
OCR_MIN_CONF=0.3
```

**Important**: Change `JWT_SECRET_KEY` to a secure random string in production!

### 1.3 Start MongoDB

**Local MongoDB:**
- Ensure MongoDB service is running
- Default connection: `mongodb://localhost:27017`

**MongoDB Atlas:**
- Update `MONGODB_URI` in `.env` with your Atlas connection string

### 1.4 Run Backend Server

```bash
python run.py
```

Backend will run on `http://localhost:5000`

**Test endpoints:**
- Health: `http://localhost:5000/health`
- API Info: `http://localhost:5000/`
- Old Dashboard: `http://localhost:5000/dashboard`

## Part 2: Frontend Setup

### 2.1 Install Node Dependencies

```bash
cd frontend-spa
npm install
```

### 2.2 Start Frontend Development Server

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

**Note**: Vite proxy is configured to forward `/api/*` requests to `http://localhost:5000`

## Part 3: Running the AI Video Pipeline

### 3.1 Process a Video File

```bash
# Activate Python venv first
python -m detection.video_pipeline --source data/snapshots/red_light_violation.mp4
```

This will:
- Detect vehicles using YOLOv8
- Track speeds and detect violations
- Extract number plates using OCR
- Save snapshots and plate images
- Insert violations into MongoDB

### 3.2 View Results

- **Old HTML Dashboard**: `http://localhost:5000/dashboard`
- **New React App**: `http://localhost:3000` (login required)

## Part 4: User Workflow

### 4.1 Register a User

1. Go to `http://localhost:3000`
2. Click "Register"
3. Fill in:
   - Name
   - Email
   - Password (min 6 characters)
   - Role: **Public User** or **Traffic Officer**
4. Submit

### 4.2 Login

1. Go to `http://localhost:3000/login`
2. Enter email and password
3. You'll be redirected to:
   - **Public User** → `/user/dashboard`
   - **Traffic Officer** → `/officer/dashboard`

### 4.3 Public User Dashboard

- View your challans
- See violation details (vehicle number, type, fine amount)
- Pay challans online
- View payment status

### 4.4 Officer Dashboard

- View all violations
- Create challans from violations
- Edit challan details (fine amount, status)
- Delete challans
- Mark challans as paid/unpaid

## Part 5: API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token

### Challans (Protected)

- `GET /api/challans` - List challans (user-specific or all for officers)
- `POST /api/challans/from-violation` - Create challan from violation
- `PATCH /api/challans/<id>` - Update challan (officers only)
- `DELETE /api/challans/<id>` - Delete challan (officers only)
- `POST /api/challans/<id>/pay` - Process payment

### Violations (Protected)

- `GET /api/violations` - List violations (with filters)

## Part 6: Database Collections

The system uses MongoDB with these collections:

- **violations** - Original violation records (from AI pipeline)
- **users** - User accounts (public users and officers)
- **challans** - Challan records linked to violations
- **payments** - Payment transactions
- **officer_logs** - Audit log of officer actions

## Troubleshooting

### Backend Issues

1. **PyTorch DLL Error**: Install Microsoft VC++ Redistributable and reinstall torch
2. **MongoDB Connection Error**: Check MongoDB is running and `MONGODB_URI` is correct
3. **Import Errors**: Ensure venv is activated and all dependencies installed

### Frontend Issues

1. **API Calls Failing**: Ensure backend is running on port 5000
2. **CORS Errors**: Backend has CORS enabled, but check proxy config in `vite.config.js`
3. **Authentication Not Working**: Check JWT tokens in browser localStorage

## Production Deployment

### Backend

- Use `gunicorn` or similar WSGI server
- Set secure `JWT_SECRET_KEY` in environment
- Use MongoDB Atlas or secured MongoDB instance
- Enable HTTPS

### Frontend

- Build: `npm run build`
- Serve `dist` folder with nginx or similar
- Configure API proxy or use CORS with backend domain

## Support

For issues or questions, check:
- Backend logs: Console output from `python run.py`
- Frontend logs: Browser console (F12)
- MongoDB: Check connection and collection data
