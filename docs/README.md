# Attendance Management System

A comprehensive, GPS-enabled QR code attendance tracking system designed for educational institutions. This system allows lecturers to generate dynamic QR codes for class sessions, which students scan to mark their attendance. It includes anti-fraud measures such as device fingerprinting and geolocation enforcement.

## 🚀 Features

- **Role-Based Access Control**:
  - **Admins**: Manage users (lecturers, students) and academic units.
  - **Lecturers**: Create class sessions, generate dynamic QR codes, and view attendance history.
  - **Students**: Scan QR codes to mark attendance and view their own attendance history.
- **Secure Attendance Marking**:
  - **Dynamic QR Codes**: Tokens refresh to prevent code sharing.
  - **Device Fingerprinting**: Prevents students from signing in for friends using the same device.
  - **Geolocation (GPS) Enforcement**: Optionally ensures students are physically present in the class.
- **Real-Time Updates**:
  - Live attendance counting for lecturers using Server-Sent Events (SSE).
- **Responsive Web Interface**:
  - Mobile-friendly design for students scanning on phones.
  - Desktop-optimized dashboard for admins and lecturers.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Security**: Bcrypt (password hashing), Device ID checks, GPS validation

## 📂 Project Structure

- `backend/` - Node.js API server and logic.
- `public/` - Static frontend files (HTML/CSS/JS).
- `start_system.sh` - Automated startup script.

## ⚡ Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL Server
- Nginx (Optional, for production reverse proxy)

### Setup & Run
1. **Clone the repository** and navigate to the folder.
2. **Configure Database**:
   - Create a MySQL database (e.g., `attendance_system`).
   - Import the schema: `mysql -u root -p attendance_system < merged_database.sql`
   - Create a `.env` file in the root directory (see `DEPLOYMENT.md` for details).
3. **Start the System**:
   Run the included helper script:
   ```bash
   ./start_system.sh
   ```
   This will install dependencies (if missing) and start the backend server.
4. **Access the App**:
   Open `http://localhost:3000` (or your configured port) in a browser.

## 📖 Documentation

- [Backend API Documentation](backend/README.md)
- [Frontend Documentation](public/README.md)
- [Database Schema](DATABASE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [User Guide](USER_GUIDE.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [API Testing Guide](API_TESTING.md)
