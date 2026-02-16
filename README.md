# Attendance System

A comprehensive web-based attendance tracking system using QR code technology for real-time student attendance management.

## 📋 Overview

This system provides a modern solution for tracking student attendance in educational institutions. It uses dynamic QR codes that refresh periodically to ensure secure and accurate attendance marking, with location verification capabilities.

### Key Features

- 🔐 **Secure Authentication** - Role-based access control (Admin/Lecturer/Student)
- 📱 **QR Code Scanning** - Dynamic QR codes that refresh automatically
- 📍 **Location Verification** - GPS-based attendance validation
- 📊 **Real-time Monitoring** - Live attendance tracking and updates
- 📈 **Analytics Dashboard** - Attendance reports and statistics
- 🔔 **Activity Logging** - Comprehensive audit trail
- ⏰ **Session Management** - Flexible session scheduling and control

## 🏗️ System Architecture

```
FinalYear/
├── backend/           # Express.js server and API
│   └── server.js     # Main server file with all endpoints
├── public/           # Frontend HTML/CSS/JS files
│   ├── css/          # Stylesheets
│   ├── js/           # JavaScript modules
│   ├── admin.html    # Admin dashboard
│   ├── attendance.html    # Attendance view
│   ├── atendeeScan.html  # Student QR scanner
│   ├── adminQR.html      # Admin QR display
│   └── index.html        # Login page
├── merged_database.sql    # Complete database schema
├── .env              # Environment configuration
└── package.json      # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Modern web browser with camera access
- HTTPS support (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Otis-Sia/FInalYear.git
   cd FInalYear
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   mysql -u root -p < merged_database.sql
   ```

4. **Configure environment variables**
   Create or update the `.env` file:
   ```env
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=attendance_system
   PORT=3000
   ```

5. **Create an admin account**
   ```bash
   node create_admin.js
   ```

6. **Start the server**
   ```bash
   node backend/server.js
   ```

7. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 👥 User Roles

### Admin
- Full system access
- User management (create, update, delete users)
- Session management
- Generate and monitor QR codes
- View system-wide analytics
- Access activity logs

### Lecturer
- Create and manage sessions
- Generate QR codes for lectures
- View attendance for their sessions
- Mark manual attendance
- Download attendance reports

### Student
- Scan QR codes to mark attendance
- View personal attendance history
- Check session schedules
- Update profile information

## 🔧 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **bcrypt** - Password hashing
- **dotenv** - Environment configuration
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - Interactivity
- **QR Code Library** - QR generation/scanning

### Database
- **MySQL 8.0** - Relational database

## 📊 Database Schema

The system uses the following main tables:

- **users** - User accounts and authentication
- **sessions** - Lecture sessions
- **attendance** - Attendance records
- **activity_logs** - System audit trail

For detailed schema information, see [DATABASE.md](DATABASE.md)

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- SQL injection prevention with parameterized queries
- Role-based access control (RBAC)
- Device ID tracking
- Location verification
- Dynamic QR code rotation
- Activity logging for audit trails

## 📱 Key Workflows

### Taking Attendance (Student)
1. Navigate to the scan page
2. Allow camera access
3. Scan the lecturer's QR code
4. System validates location (if required)
5. Attendance marked automatically

### Creating a Session (Lecturer/Admin)
1. Log in to the system
2. Navigate to session management
3. Fill in session details (title, location, date/time)
4. Enable location verification if needed
5. Generate QR code
6. Display QR code to students

### Viewing Reports (Admin/Lecturer)
1. Access the dashboard
2. Select session or date range
3. View attendance statistics
4. Export reports if needed

## 🛠️ Utility Scripts

### `create_admin.js`
Creates a new admin user account
```bash
node create_admin.js
```

### `migrate_db.js`
Database migration utility
```bash
node migrate_db.js
```

### `generate_cert.sh`
Generates SSL certificates for HTTPS
```bash
bash generate_cert.sh
```

## 📝 API Documentation

For detailed API endpoint documentation, see [backend/README.md](backend/README.md)

Key endpoints:
- `POST /api/login` - User authentication
- `POST /api/register` - User registration
- `POST /api/sessions` - Create session
- `POST /api/attendance` - Mark attendance
- `GET /api/sessions/:id` - Get session details
- `GET /api/attendance/:sessionId` - Get attendance records

## 🌐 Frontend Documentation

For frontend structure and components, see [public/README.md](public/README.md)

## 🚢 Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env` file
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Camera Not Working
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Verify camera hardware is functional

### QR Code Not Scanning
- Ensure adequate lighting
- Check if QR code has expired (refresh if needed)
- Verify location permissions if required

## 📄 License

This project is part of a Final Year project. All rights reserved.

## 👨‍💻 Author

**Otis-Sia**
- GitHub: [@Otis-Sia](https://github.com/Otis-Sia)

## 🤝 Contributing

This is an academic project. For questions or suggestions, please open an issue.

## 📧 Support

For support, please contact the system administrator or create an issue in the repository.

---

**Built with ❤️ for education**
