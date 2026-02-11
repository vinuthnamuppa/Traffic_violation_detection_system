# Quick Start Guide - How to Run & Test

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.12 (or 3.11) installed
- ✅ Node.js 16+ and npm installed
- ✅ MongoDB running (local or Atlas)
- ✅ Microsoft VC++ Redistributable (for PyTorch on Windows)

## Step 1: Backend Setup

### 1.1 Navigate to Project Root
```bash
cd D:\B22CS074\traffic_major_cursor\traffic_violation_system
```

### 1.2 Activate Virtual Environment
```powershell
# Windows PowerShell (if execution policy allows):
.\.venv\Scripts\Activate.ps1

# OR Windows CMD:
cmd /c ".\.venv\Scripts\activate.bat"

# OR use Python directly (no activation needed):
# Just use: .\.venv\Scripts\python.exe instead of python
```

### 1.3 Create .env File (if not exists)

Create `.env` file in project root with:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=traffic_violation_db
MONGODB_COLLECTION_VIOLATIONS=violations
MONGODB_COLLECTION_USERS=users
MONGODB_COLLECTION_CHALLANS=challans
MONGODB_COLLECTION_PAYMENTS=payments
MONGODB_COLLECTION_OFFICER_LOGS=officer_logs

# JWT Configuration (CHANGE THIS IN PRODUCTION!)
JWT_SECRET_KEY=your-secret-key-change-this-in-production-12345
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=86400

# AI Pipeline Configuration
SPEED_LIMIT_KMPH=60
STOP_LINE_Y=350
OCR_MIN_CONF=0.3
```

### 1.4 Install Backend Dependencies (if not done)
```bash
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 1.5 Start MongoDB (if using local MongoDB)

**Windows Service:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If stopped, start it:
Start-Service MongoDB
```

**Or start manually:**
```bash
# Find MongoDB installation and run mongod.exe
# Usually: C:\Program Files\MongoDB\Server\*\bin\mongod.exe
```

### 1.6 Start Flask Backend Server

```bash
.\.venv\Scripts\python.exe run.py
```

**Expected Output:**
```
 * Serving Flask app 'backend.app'
 * Debug mode: on
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

**✅ Backend is running!** Keep this terminal open.

### 1.7 Test Backend (Open New Terminal)

```bash
# Test health endpoint
curl http://localhost:5000/health

# OR open in browser:
# http://localhost:5000/health
```

**Expected Response:**
```json
{"status": "ok", "message": "Traffic Violation Backend running"}
```

---

## Step 2: Frontend Setup

### 2.1 Open New Terminal Window

Keep backend running, open a **new terminal**.

### 2.2 Navigate to Frontend Directory
```bash
cd D:\B22CS074\traffic_major_cursor\traffic_violation_system\frontend-spa
```

### 2.3 Install Frontend Dependencies
```bash
npm install
```

**This will take a few minutes** - installing React, Tailwind, etc.

### 2.4 Start Frontend Development Server
```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**✅ Frontend is running!** Keep this terminal open.

### 2.5 Open Browser
Navigate to: **http://localhost:3000**

You should see the **Landing Page** with hero section and features.

---

## Step 3: Testing the System

### Test 1: Registration

1. Click **"Register"** button (or go to `http://localhost:3000/register`)
2. Fill in the form:
   - **Name**: Test User
   - **Email**: test@example.com
   - **Account Type**: Select **"Public User"**
   - **Password**: test123
   - **Confirm Password**: test123
3. Click **"Register"**

**✅ Expected:** Redirected to User Dashboard (may be empty initially)

### Test 2: Register an Officer

1. Click **"Logout"** (if logged in)
2. Click **"Register"** again
3. Fill in:
   - **Name**: Officer Test
   - **Email**: officer@example.com
   - **Account Type**: Select **"Traffic Officer"**
   - **Password**: officer123
   - **Confirm Password**: officer123
4. Click **"Register"**

**✅ Expected:** Redirected to Officer Dashboard

### Test 3: Login

1. Click **"Logout"**
2. Click **"Login"** (or go to `http://localhost:3000/login`)
3. Enter:
   - **Email**: test@example.com
   - **Password**: test123
4. Click **"Sign in"**

**✅ Expected:** Redirected to User Dashboard

### Test 4: Create a Violation (Using AI Pipeline)

**Open a NEW terminal** (keep backend and frontend running):

```bash
cd D:\B22CS074\traffic_major_cursor\traffic_violation_system

# Activate venv (if needed)
.\.venv\Scripts\Activate.ps1

# Run video pipeline on your red-light video
.\.venv\Scripts\python.exe -m detection.video_pipeline --source data\snapshots\red_light_violation.mp4
```

**Note:** If you get torch/OCR errors, you can skip OCR:
```bash
.\.venv\Scripts\python.exe -m detection.video_pipeline --source data\snapshots\red_light_violation.mp4 --no-ocr
```

**✅ Expected:** 
- Video window opens showing detection
- Violations detected and saved to MongoDB
- Console shows: `[DB] Inserted violation ...`

### Test 5: View Violations (Officer Dashboard)

1. **Login as Officer** (`officer@example.com` / `officer123`)
2. Go to **Officer Dashboard**
3. Click **"Violations"** tab

**✅ Expected:** See list of violations detected by AI pipeline

### Test 6: Create Challan from Violation (Officer)

1. In **Officer Dashboard** → **Violations** tab
2. Find a violation
3. Click **"Create Challan"** button

**✅ Expected:** 
- Alert: "Challan created successfully"
- Switch to **Challans** tab to see the new challan

### Test 7: Edit Challan (Officer)

1. In **Officer Dashboard** → **Challans** tab
2. Click **"Edit"** on any challan
3. Change **Fine Amount** or **Status**
4. Click **"Save"**

**✅ Expected:** 
- Alert: "Challan updated successfully"
- Changes reflected in the list

### Test 8: View Challans (Public User)

1. **Logout** from Officer account
2. **Login** as Public User (`test@example.com` / `test123`)
3. Go to **User Dashboard**

**✅ Expected:** See challans (if any were created for your vehicle number)

**Note:** Currently challans are linked by `user_id`. For testing, you can:
- Create challans manually via API, OR
- Modify the system to link by vehicle_number (future enhancement)

### Test 9: Pay Challan (Public User)

1. In **User Dashboard**
2. Find an **unpaid** challan
3. Click **"Pay Challan"** button
4. Confirm payment

**✅ Expected:**
- Alert: "Payment successful! Receipt generated."
- Challan status changes to **"PAID"**

### Test 10: API Testing (Using Browser/Postman)

**Test Registration API:**
```bash
# Open browser console (F12) or use Postman
# POST http://localhost:5000/api/auth/register
# Body (JSON):
{
  "name": "API Test User",
  "email": "apitest@example.com",
  "password": "test123",
  "role": "public"
}
```

**Test Login API:**
```bash
# POST http://localhost:5000/api/auth/login
# Body (JSON):
{
  "email": "apitest@example.com",
  "password": "test123"
}
```

**Expected Response:**
```json
{
  "status": "success",
  "user": {
    "id": "...",
    "name": "API Test User",
    "email": "apitest@example.com",
    "role": "public"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Test Get Challans (with token):**
```bash
# GET http://localhost:5000/api/challans
# Headers:
#   Authorization: Bearer <access_token_from_login>
```

---

## Step 4: Verify Everything Works

### ✅ Checklist

- [ ] Backend server running on `http://localhost:5000`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] MongoDB connected (no connection errors in backend logs)
- [ ] Can register Public User
- [ ] Can register Traffic Officer
- [ ] Can login with both accounts
- [ ] User Dashboard loads (may be empty)
- [ ] Officer Dashboard loads
- [ ] Can view violations (after running video pipeline)
- [ ] Can create challan from violation
- [ ] Can edit challan
- [ ] Can delete challan
- [ ] Can pay challan (simulated)

---

## Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'backend'`
- **Solution:** Run from project root: `python run.py` (not from backend folder)

**Problem:** `MongoDB connection error`
- **Solution:** 
  - Check MongoDB is running: `Get-Service MongoDB`
  - Verify `MONGODB_URI` in `.env` file
  - For Atlas: Use full connection string

**Problem:** `JWT_SECRET_KEY` error
- **Solution:** Add `JWT_SECRET_KEY=some-random-string` to `.env` file

### Frontend Issues

**Problem:** `npm install` fails
- **Solution:** 
  - Update npm: `npm install -g npm@latest`
  - Clear cache: `npm cache clean --force`
  - Try: `npm install --legacy-peer-deps`

**Problem:** API calls fail (CORS or 404)
- **Solution:**
  - Ensure backend is running on port 5000
  - Check `vite.config.js` proxy configuration
  - Check browser console for errors

**Problem:** Can't login after registration
- **Solution:**
  - Check browser console (F12) for errors
  - Verify backend logs show successful registration
  - Check MongoDB `users` collection has the new user

### Video Pipeline Issues

**Problem:** Torch DLL error (`c10.dll`)
- **Solution:** 
  - Install Microsoft VC++ Redistributable
  - Reinstall torch: `pip uninstall torch torchvision && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`

**Problem:** OCR import fails
- **Solution:** Run with `--no-ocr` flag (violations will still be detected, just no plate recognition)

---

## Quick Test Commands

### Test Backend API (using curl or browser)

```bash
# Health check
curl http://localhost:5000/health

# Get violations (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/violations

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","role":"public"}'
```

### Test MongoDB Connection

```bash
# Using Python (in venv)
.\.venv\Scripts\python.exe -c "from backend.database import get_db; db = get_db(); print('Connected!', db.name)"
```

### Check Collections Created

```bash
# Using MongoDB Compass or mongo shell
# Connect to: mongodb://localhost:27017
# Database: traffic_violation_db
# Collections should include: violations, users, challans, payments, officer_logs
```

---

## Next Steps After Testing

1. **Run video pipeline** on real traffic videos
2. **Create challans** for detected violations
3. **Test payment flow** end-to-end
4. **Check officer logs** in MongoDB
5. **Customize fine amounts** in `backend/models/challan.py`
6. **Add more violation types** if needed

---

## Summary

**Backend:** `http://localhost:5000`
- Health: `http://localhost:5000/health`
- API: `http://localhost:5000/api/*`

**Frontend:** `http://localhost:3000`
- Landing: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Register: `http://localhost:3000/register`
- User Dashboard: `http://localhost:3000/user/dashboard`
- Officer Dashboard: `http://localhost:3000/officer/dashboard`

**Both servers must be running simultaneously!**
