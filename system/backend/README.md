# Backend API Documentation

The backend service is built using **Node.js** and **Express.js**, providing a RESTful API for client applications. It handles authentication, attendance tracking, session management, and user administration. It uses **MySQL** as its data store.

## Endpoints

### 🔐 Authentication

#### `POST /api/register`
Creates a new user account.
**Admin/Student/Lecturer Roles** are enforced. Duplicate `user_id` or `email` will return 409 Conflict.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "university_id": "CT-001",
    "password": "Password123",
    "role": "student | lecturer | admin",
    "email": "jane@example.com"
  }
  ```
- **Response**: `200 { "success": true }`

#### `POST /api/login`
Authenticates a user and returns their role and ID.
- **Request Body**:
  ```json
  {
    "university_id": "CT-001",
    "password": "Password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "id": 15,
      "name": "Jane Doe",
      "university_id": "CT-001",
      "role": "student"
    }
  }
  ```

### 🏫 Unit Management

#### `GET /api/units/:lecturer_id`
Lists units assigned to a specific lecturer.
- **Response**: `200 [ { "id": 1, "unit_code": "CS101", "unit_name": "Intro to CS" }, ... ]`

#### `POST /api/units`
Adds a new unit (usually an admin function, but potentially usable by lecturers if allowed).
- **Request Body**:
  ```json
  {
    "unit_code": "CS101",
    "unit_name": "Intro to CS",
    "lecturer_id": 5
  }
  ```

### ⏰ Session Management

#### `POST /api/sessions`
Starts a new class session. Generates an initial QR token.
- **Request Body**:
  ```json
  {
    "unit_code": "CS101",
    "lecturer_id": 5,
    "latitude": -1.2921,
    "longitude": 36.8219,
    "require_gps": true 
    // If require_gps is false, latitude/longitude are optional.
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "session_id": 42,
    "qr_token": "abc123token...",
    "require_gps": 1
  }
  ```

#### `PUT /api/sessions/:id/token`
Refreshes the QR token for an active session to prevent code sharing.
- **Request Body**: `{ "lecturer_id": 5 }`
- **Response**: `{ "success": true, "qr_token": "newtoken..." }`

#### `PUT /api/sessions/:id/end`
Marks a session as inactive (`is_active = 0`). Only the session creator (lecturer) can do this.
- **Request Body**: `{ "lecturer_id": 5 }`

#### `GET /api/sessions/:id/events`
Subscribe to Server-Sent Events (SSE) for real-time attendance updates.
- **Content-Type**: `text/event-stream`
- **Events**: `attendance_marked` (includes session ID)

### ✅ Attendance

#### `POST /api/attendance`
The student scans a QR code to mark attendance. Checks:
1. **Distance**: Within ~100m of session origin (if GPS required).
2. **Device**: Ensures this device hasn't signed in another student for this session.
3. **Status**: Ensures session is active and token matches.
- **Request Body**:
  ```json
  {
    "student_id": 15,
    "session_id": 42,
    "qr_token": "current_token_value",
    "latitude": -1.2921,
    "longitude": 36.8219,
    "device_id": "unique-browser-fingerprint"
  }
  ```
- **Response**: `200 { "success": true, "distance": 12 }` (distance in meters)

#### `GET /api/sessions/:id/attendance`
Lists all students who attended a specific session.
- **Response**: `[ { "name": "Jane", "university_id": "CT-001", "timestamp": "..." }, ... ]`

### 📜 History

#### `GET /api/history/lecturer/:lecturer_id/sessions`
Shows past sessions created by a lecturer, including attendance counts.

#### `GET /api/history/student/:student_id/attended`
Shows past sessions attended by a student.

### 👑 Admin API

Note: Admin routes require an `admin_id` in the query string or body for basic authorization check (middleware `requireAdmin`).

- `GET /api/admin/users`: List all users.
- `POST /api/admin/users`: Create user.
- `DELETE /api/admin/users/:id`: Delete user.
- `GET /api/admin/units`: List all units.
- `POST /api/admin/units`: Create unit.
- `DELETE /api/admin/units/:id`: Delete unit.
- `GET /api/admin/lecturers`: Minimal list of lecturers for dropdowns.
