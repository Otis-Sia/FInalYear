# Frontend Documentation

The frontend of the Attendance Management System is built with **Vanilla HTML5**, **CSS3**, and **JavaScript** (ES6+). It communicates with the backend API via `fetch()` requests and handles UI updates dynamically. It also uses the device's camera for QR scanning (likely `html5-qrcode` or similar).

## 📁 Directory Structure

### HTML Pages

- **index.html**: **Login Page**.
  Displays login form with role selection (Student, Lecturer, Admin). Redirects users based on their role upon successful authentication.
- **admin.html**: **Admin Dashboard**.
  Allows admins to manage users (create/delete) and units. See `js/admin.js`.
- **adminQR.html**: **QR Code Display**.
  Shows the live, refreshing QR code for a specific session. Connects to `api/sessions/:id/events` (SSE) to update attendance count in real-time.
- **atendeeScan.html**: **Student Scanner**.
  Uses the device camera to scan the QR code. Once scanned, sends geolocation + device ID + token to the backend.
- **attendance.html**: **Session Attendance List**.
  View for lecturers to see the list of students who attended a specific session.
- **history.html**: **General History**.
  Role-based view.
  - **Lecturers**: See a list of all their past sessions.
  - **Students**: See a list of all sessions they have attended.
- **registerSessions.html**: **start Session**.
  Form for lecturers to create a new session (select unit, toggle GPS requirement).

### Styles

- **css/style.css**: Main stylesheet (responsive design, dark/light theme support).
- **css/admin.css**: Specific styles for the admin dashboard (if separate).

### JavaScript Logic

- **js/config.js**:
  Contains global configuration like API base URL (e.g., `http://localhost:3000`).
- **js/script.js**:
  Core application logic. Handles:
  - Login/Logout state management.
  - Session creation (Lecturer).
  - QR Code generation and refreshment.
  - QR Scanning logic (Student).
  - Geolocation capture (`navigator.geolocation`).
  - History data fetching.
- **js/admin.js**:
  Admin-specific logic. Handles:
  - Fetching list of users/units.
  - Form submissions for creating new users/units.
  - Deleting users/units.

## 🔑 Key Features

### QR Code Scanning
The system uses `html5-qrcode` (or similar) to access the device camera directly in the browser.
Students must grant camera permissions.

### Geolocation
When a session mandates "Require GPS", the frontend captures latitude/longitude using the browser's Geolocation API. This data is sent to the backend for distance verification.

### Real-time Updates
The `adminQR.html` page uses **Server-Sent Events (SSE)** to update the "Attended: X" count instantly without refreshing the page.
Check `eventSource.onmessage` in `script.js` (or relevant file).
