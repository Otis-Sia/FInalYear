# Database Schema Documentation

The system uses a **MySQL** relational database named `attendance_system`. It stores user credentials, academic units, class sessions, and attendance records.

## Tables

### 1. `users`
Stores all system users (Students, Lecturers, Admins).
- **id** (`INT`, PK): Auto-incrementing unique user ID.
- **user_id** (`VARCHAR(50)`, UNIQUE): Human-readable ID (e.g., `CT-001`, `L-005`). Used for login.
- **full_name** (`VARCHAR(100)`): User's full name.
- **university_id** (`VARCHAR(50)`): Optional university-wide ID (e.g., for importing).
- **email** (`VARCHAR(100)`, UNIQUE): Optional email address.
- **password** (`VARCHAR(255)`): Bcrypt hashed password.
- **role** (`ENUM('student', 'lecturer', 'admin')`): Limits access permissions.
- **created_at** (`TIMESTAMP`): Record creation time.

### 2. `units`
Represents academic courses/subjects.
- **id** (`INT`, PK): Auto-incrementing unique ID.
- **unit_code** (`VARCHAR(50)`): Course code (e.g., `CS101`).
- **unit_name** (`VARCHAR(100)`): Course title (e.g., `Introduction to Computer Science`).
- **lecturer_id** (`INT`, FK -> `users.id`): ID of the assigned lecturer.

### 3. `sessions`
Represents a specific class instance for a unit.
- **id** (`INT`, PK): Auto-incrementing unique session ID.
- **unit_code** (`VARCHAR(50)`): Code of the unit being taught.
- **lecturer_id** (`INT`, FK -> `users.id`): ID of the lecturer conducting the session.
- **qr_token** (`VARCHAR(255)`): Current active QR token for attendance. Refreshed periodically.
- **is_active** (`TINYINT(1)`): Boolean flag (1=Active, 0=Ended).
- **require_gps** (`TINYINT(1)`): Boolean flag (1=Requires GPS validation, 0=None).
- **latitude** (`DECIMAL(10,8)`): GPS latitude of the session location (if GPS required).
- **longitude** (`DECIMAL(11,8)`): GPS longitude of the session location (if GPS required).
- **created_at** (`TIMESTAMP`): Session start time.
- **ended_at** (`TIMESTAMP`): Session end time (stores NULL while active).

### 4. `attendance`
Records individual student attendance for a session.
- **id** (`INT`, PK): Auto-incrementing unique record ID.
- **session_id** (`INT`, FK -> `sessions.id`): The class session.
- **student_id** (`INT`, FK -> `users.id`): The student marking attendance.
- **status** (`ENUM('Present', 'Late', 'Absent')`): Attendance status (default: 'Present').
- **device_id** (`VARCHAR(255)`): Fingerprint of the device used to scan. Used to prevent multiple check-ins from one device.
- **timestamp** (`TIMESTAMP`): Exact time of check-in.
- **UNIQUE KEY** (`session_id`, `student_id`): Prevents duplicate check-ins for the same session.

### 5. `activity_logs`
System usage logs for auditing.
- **id** (`INT`, PK): Log ID.
- **user_id** (`INT`, FK -> `users.id`): User performing the action.
- **action** (`VARCHAR(50)`): Action name (e.g., `LOGIN`, `SESSION_START`).
- **details** (`TEXT`): Additional info.
- **timestamp** (`TIMESTAMP`): Time of action.

## Relationships

- **User -> Units**: One-to-Many (One lecturer can teach many units).
- **User -> Sessions**: One-to-Many (One lecturer can create many sessions).
- **User -> Attendance**: Many-to-Many (via `attendance` join table). A student attends many sessions; a session has many students.
- **Session -> Attendance**: One-to-Many.

## Common Queries

### Get Attendance List for a Session
```sql
SELECT u.full_name, u.user_id, a.timestamp 
FROM attendance a 
JOIN users u ON a.student_id = u.id 
WHERE a.session_id = ?;
```

### Check Student Attendance History
```sql
SELECT s.unit_code, s.created_at, a.status 
FROM attendance a 
JOIN sessions s ON a.session_id = s.id 
WHERE a.student_id = ? 
ORDER BY s.created_at DESC;
```
