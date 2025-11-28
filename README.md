# Customer Portal POC

A minimal Customer Portal proof-of-concept built with Next.js (frontend) and Express.js (backend), integrating with ServiceM8 API.

## Features

- **User Authentication**: Login using email+password, phone+password, or employee ID+password
- **Bookings List**: View all customer bookings
- **Booking Details**: Access detailed information about specific bookings
- **File Attachments**: View associated file attachments for bookings
- **Messaging**: Send and view messages related to bookings

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **API Integration**: ServiceM8 REST API
- **Data Persistence**: In-memory storage (for POC)

## Prerequisites

- Node.js 18+ and npm
- ServiceM8 API credentials (optional - mock data available if not configured)

## Setup Instructions

### 1. Install Dependencies

From the project root:

```bash
npm run install:all
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Backend

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your ServiceM8 credentials (optional):

```
PORT=3001
SERVICEM8_EMAIL=your-email@example.com
SERVICEM8_TOKEN=your-api-token
```

**Note**: If ServiceM8 credentials are not provided, the backend will use mock data for demonstration purposes.

### 3. Configure Frontend

Create a `.env.local` file in the `frontend` directory:

```bash
cd frontend
cp .env.local.example .env.local
```

The default configuration should work for local development. Update if your backend runs on a different port.

### 4. Run the Application

From the project root, run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Demo Credentials

Use any of these login methods:

**Email Login:**
- Email: `stephanytayong@gmail.com`
- Password: `password123`

**Phone Login:**
- Phone: `+61730595222`
- Password: `password123`


Or use the second test account:
- Email: `johnsmith@gmail.com` / Phone: `+61756117044`
- Password: `password123`

## Project Structure

```
customer-portal/
├── backend/
│   ├── server.js          # Express.js server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── login/         # Login page
│   │   ├── bookings/      # Bookings list and details
│   │   └── layout.tsx
│   ├── lib/
│   │   └── api.ts         # API client functions
│   └── package.json
├── package.json           # Root package.json with scripts
├── README.md
└── TECH_NOTES.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email+password, phone+password, or employee ID+password
  - Body: `{ loginMethod: 'email'|'phone'|'employeeId', email?: string, phone?: string, employeeId?: string, password: string }`

### Bookings
- `GET /api/bookings?customerId={id}` - Get all bookings for a customer
- `GET /api/bookings/:bookingId` - Get booking details
- `GET /api/bookings/:bookingId/attachments` - Get attachments for a booking

### Messages
- `GET /api/bookings/:bookingId/messages` - Get messages for a booking
- `POST /api/bookings/:bookingId/messages` - Send a message

## ServiceM8 API Integration

The backend integrates with ServiceM8 API using their REST API. The integration:

- Uses ServiceM8's authentication method (email + token)
- Fetches real booking data when credentials are configured
- Falls back to mock data when credentials are not available (for POC demonstration)

To use real ServiceM8 data:
1. Register your application at https://developer.servicem8.com
2. Obtain API credentials
3. Add credentials to `backend/.env`

## Development Notes

- The application uses in-memory storage for messages and user data (suitable for POC)
- Authentication is simplified (no JWT tokens) for POC purposes
- File attachments are mocked but the structure supports real file serving
- The frontend uses client-side routing and localStorage for session management

## Troubleshooting

**Backend won't start:**
- Ensure port 3001 is not in use
- Check that all dependencies are installed

**Frontend can't connect to backend:**
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

**ServiceM8 API errors:**
- Verify credentials in `backend/.env`
- Check ServiceM8 API documentation for endpoint changes
- The app will use mock data if API calls fail

## License

This is a proof-of-concept project for evaluation purposes.

