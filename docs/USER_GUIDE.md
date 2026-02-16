# User Guide

This manual explains how to use the Attendance Management System.

## Roles

The system supports three user roles:
1. **Administrator**: Manages users and courses.
2. **Lecturer**: Creates class sessions and generates QR codes.
3. **Student**: Marks attendance by scanning QR codes.

---

## 👑 Administrator Guide

### 1. Logging In
- Access the application URL.
- Enter your **Admin ID** (e.g., `ADM-001`) and password.
- Click **Login**.

### 2. Dashboard Overview
The Admin dashboard (`admin.html`) provides:
- **User Management**: List of all registered students and lecturers.
- **Unit Management**: List of all academic units.

### 3. Creating a User
1. Navigate to the **Users** section.
2. Click **Create User**.
3. Fill in the form:
   - **Full Name**: e.g., "John Doe".
   - **University ID**: Unique ID (e.g., `SCT-123`).
   - **Email**: User's email address.
   - **Role**: Select `Student`, `Lecturer`, or `Admin`.
   - **Password**: Set a temporary password.
4. Click **Submit**.

### 4. Creating a Unit
1. Navigate to the **Units** section.
2. Click **Create Unit**.
3. Enter the **Unit Code** (e.g., `CSC 101`) and **Unit Name**.
4. Assign a **Lecturer** (start typing their name or select from the dropdown).
5. Click **Submit**.

---

## 👨‍🏫 Lecturer Guide

### 1. Starting a Session
1. Log in with your **Lecturer ID**.
2. On your dashboard, you will see a list of your assigned units.
3. Click **Start Session** next to the relevant unit.
4. **GPS Requirement**:
   - Check "Require GPS" if you want to ensure students are in the classroom.
   - Uncheck it for remote/online classes.
5. The system will generate a dynamic **QR Code**.

### 2. Managing the Session
- Project the QR code on the classroom screen.
- The QR code automatically refreshes every few seconds preventing students from taking pictures and sharing them.
- You can see the **Live Attendance Count** update in real-time as students scan.
- Click **End Session** when the class is over to stop accepting new scans.

### 3. Viewing History
- Go to the **History** tab.
- View a list of your past sessions.
- Click a session to see the detailed list of students who attended.

---

## 🎓 Student Guide

### 1. Marking Attendance
1. Log in with your **Student ID**.
2. Click **Scan QR Code**.
3. Allow camera permissions if prompted.
4. Point your camera at the lecturer's screen.
5. **If GPS is required**:
   - Ensure your device's location services are turned ON.
   - You must be within range (approx. 100 meters) of the lecturer/classroom.
6. Upon success, you will see a **"Marked as Present"** confirmation.

### 2. Troubleshooting
- **"Location not found"**: Enable GPS on your phone and refresh the page.
- **"Device already used"**: You cannot use your friend's phone to sign in. Use your own device.
- **"Session ended"**: The lecturer has closed the attendance window.

### 3. Viewing History
- Go to the **History** tab to see a log of all classes you have attended.
