# API Testing Guide

This guide helps you verify the backend API using tools like **curl** or **Postman**.

---

## Prerequisites

- Base URL: `http://localhost:3000`
- Content-Type: `application/json`

---

## 1. Authentication

### Register a User

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "university_id": "TEST-001",
    "password": "pass",
    "role": "student" 
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "university_id": "TEST-001",
    "password": "pass"
  }'
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Test User",
    "university_id": "TEST-001",
    "role": "student"
  }
}
```

---

## 2. Session Management (Lecturer)

### Start a Session

Requires `lecturer_id` (obtained from Login).

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "unit_code": "CS101",
    "lecturer_id": 1,
    "require_gps": false
  }'
```

**Response**:
```json
{
  "success": true,
  "session_id": 5,
  "qr_token": "abc123token...",
  "require_gps": 0
}
```

### End a Session

```bash
curl -X PUT http://localhost:3000/api/sessions/5/end \
  -H "Content-Type: application/json" \
  -d '{ "lecturer_id": 1 }'
```

---

## 3. Attendance (Student)

### Mark Attendance

Requires `session_id`, `qr_token`, `student_id`, and `device_id`. If `require_gps` is true, add `latitude` and `longitude`.

```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 2,
    "session_id": 5,
    "qr_token": "abc123token...",
    "device_id": "unique-device-fingerprint-123"
  }'
```

**Response**:
```json
{
  "success": true,
  "distance": 0
}
```

---

## 4. Admin Operations

### List Users (Requires Admin ID)

```bash
curl -X GET "http://localhost:3000/api/admin/users?admin_id=1"
```

### Create Unit

```bash
curl -X POST http://localhost:3000/api/admin/units \
  -H "Content-Type: application/json" \
  -d '{
    "unit_code": "BIO 101",
    "unit_name": "Biology 1",
    "lecturer_id": 1,
    "admin_id": 1
  }'
```

---

## Postman Collection

To import these into Postman:
1. Create a new Collection named "Attendance System".
2. Add a Request for each endpoint above.
3. Set the variables `{{base_url}}` to `http://localhost:3000`.
