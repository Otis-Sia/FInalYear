# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-15

### Added
- **Core System**:
  - User authentication (Register/Login).
  - Role-based access control (Student, Lecturer, Admin).
  - Unit management (Create, List, Delete).
  - Session management (Start, End, History).
  - Attendance marking (QR Code scanning).
  - Geolocation verification (Radius check).
  - Device fingerprinting to prevent buddy punching.
  - Real-time attendance updates via SSE.

### Security
- Password hashing with **Bcrypt**.
- SQL injection protection via parameterized queries.
- CORS configuration for local network testing.

### Documentation
- `README.md`: Project overview and setup.
- `backend/README.md`: API reference.
- `public/README.md`: Frontend structure.
- `DATABASE.md`: Schema details.
- `DEPLOYMENT.md`: Installation guide.
- `USER_GUIDE.md`: Usage manual.
- `CONTRIBUTING.md`: Development guidelines.
- `API_TESTING.md`: Testing instructions.
