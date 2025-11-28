# Customer Portal POC - Technical Notes

## What Was Built
This Customer Portal POC is a full-stack web app that allows customers to:

1. **Login** using email+password or phone+password (JWT authentication).

   [Login Screenshot](https://drive.google.com/file/d/17MY3F9UBlHCohhxsbazHhrBleXUsLBI2/view?usp=drive_link)


2. **View Bookings**
   - List with color-coded status badges, vehicle info, dates, attachment count.
   - Clickable cards to see booking details.
   - Handles empty, loading, and error states.

   [Homepage Screenshot](https://drive.google.com/file/d/1yvVl4TMjUPhsPCHBVkblbaYlw9D8uiHZ/view?usp=sharing)

3. **Booking Details**
   - Show full booking info: status, schedule, vehicle, address, billing, work done. [Booking Details Screenshot](https://drive.google.com/file/d/1Z642VDZeU7YT37_tDQby9CEZtY5OdjWK/view?usp=drive_link)
   - View/download quotes and invoices as PDFs. [Quote Screenshot](https://drive.google.com/file/d/1ECOM3U3t0VTz_VGWQNZrTmoj-vtf61Iz/view?usp=sharing)
   - See and send messages related to the booking. [Message Screenshot](https://drive.google.com/file/d/1WO1Tg0tErqvuc1-NNlSDFhtyAj98spfI/view?usp=drive_link)
   - View and download attachments. [Downloaded PDF Screenshot](https://drive.google.com/file/d/1G5-l6NT-HILFO3_e6ce5bC0JDntWkoCL/view?usp=drive_link)

   ---

   You can also watch the full demo here:
   [Recorded Demo of the Customer Portal](https://drive.google.com/file/d/18MFo3wJTNZPJltPwob5-LOowZRe9evEf/view?usp=sharing)



**Tech Stack:**
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, React hooks, localStorage for session.
- **Backend:** Express.js REST API, JWT auth, bcrypt, ServiceM8 API integration, file-based message storage.
- **Integration:** ServiceM8 API with pagination and mock data fallback.

---

## Key Design Choices
- **Frontend/Backend Separation:** Clear separation of concerns, easier scaling.
- **Next.js App Router:** Modern React patterns, dynamic routing, type safety.
- **Express.js:** Simple, extendable REST API framework.
- **In-Memory Storage:** Quick POC; messages stored in JSON files.
- **ServiceM8 API Integration:** Fetch real booking data with fallback to mock data.

---

## Assumptions Made
1. **Authentication:** JWT stored in localStorage; email or phone login; simple password rules.
2. **ServiceM8 API:** Uses API key; jobs filtered by customer UUID; paginated responses; attachments and vehicle data available.
3. **Data Structure:** Bookings have status, schedule, vehicle, attachments, messages, documents; vehicles have make, model, year, rego, VIN.
4. **User Experience:** Users want immediate bookings view; visual status indicators; downloadable documents; Australian date formatting.
5. **Technical:** PDF generation client-side (jsPDF); console logging allowed; local dev environment assumed.
6. **Deployment:** Frontend (3000) and backend (3001) on localhost; open CORS for dev; production requires secure setup.

---

## Potential Improvements
- **Security:** Use httpOnly cookies, input validation, rate limiting, CSRF protection.
- **Persistence:** Replace in-memory storage with a database.
- **ServiceM8:** Full OAuth, webhooks, retry logic, more endpoints.
- **Frontend:** Search/filter, better loading states, accessibility, offline support.
- **Backend:** Logging, caching, background jobs, file storage.
- **DevOps:** CI/CD, Docker, monitoring, environment-specific configs.
- **Testing:** Unit, integration, E2E, frontend component tests.

---

## How AI Assisted the Workflow

1. **Research & Learning**
   - Explored ServiceM8 API docs, authentication, and pagination.

2. **Code Generation**
   - Generated boilerplate for Next.js frontend and Express backend.
   - Created TypeScript interfaces for API responses.

3. **UI/UX Implementation**
   - Designed bookings list and details page layout.

4. **Data Integration & Transformation**
   - Handled edge cases like missing or invalid dates.

5. **Problem Solving & Debugging**
   - Resolved API integration issues, CORS problems, and date formatting.
   - Debugged JWT auth flow and React state management.
   - Fixed TypeScript type mismatches.

6. **Code Quality & Best Practices**
   - Ensured consistent error handling and type safety.

7. **Documentation**
   - Helped write technical notes, README, API documentation, and troubleshooting guides.

**Impact:**
AI significantly sped up development, reduced boilerplate coding, improved code quality, and helped implement features efficiently.
