# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm installed

## Step-by-Step Setup

### 1. Install All Dependencies

```bash
npm run install:all
```

This will install dependencies for:
- Root project (concurrently for running both servers)
- Backend (Express.js and dependencies)
- Frontend (Next.js and dependencies)

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and optionally add ServiceM8 credentials:

```
PORT=3001
SERVICEM8_EMAIL=your-email@example.com
SERVICEM8_TOKEN=your-api-token
```

**Note**: If you don't have ServiceM8 credentials, the app will work with mock data.

### 3. Configure Frontend Environment

```bash
cd ../frontend
cp .env.local.example .env.local
```

The default configuration should work. The frontend will connect to `http://localhost:3001/api`.

### 4. Start the Application

From the project root:

```bash
npm run dev
```

This starts both servers:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### 5. Access the Application

1. Open http://localhost:3000 in your browser
2. You'll be redirected to the login page
3. Choose a login method and use demo credentials:
   - **Email**: `stephanytayong@gmail.com` / Password: `password123`
   - **Phone**: `+61730595222` / Password: `password123`
 

## Running Servers Separately

If you prefer to run servers in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

1. **Backend**: Change `PORT` in `backend/.env`
2. **Frontend**: Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to match

### Dependencies Not Installing

Try installing manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Frontend Can't Connect to Backend

1. Verify backend is running on port 3001
2. Check browser console for CORS errors
3. Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

### ServiceM8 API Issues

If you see API errors:
- The app will automatically use mock data
- Check your ServiceM8 credentials in `backend/.env`
- Verify your ServiceM8 account has API access enabled

## Next Steps

After setup:
1. Log in with demo credentials
2. View your bookings
3. Click on a booking to see details
4. View attachments
5. Send messages

See `README.md` for more detailed information and `TECH_NOTES.md` for technical details.

