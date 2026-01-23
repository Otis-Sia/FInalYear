require("dotenv").config(); // Load environment variables
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(cors()); // Open for development
app.use(express.json());
app.use(express.static('public'));

/* ================= DATABASE CONNECTION ================= */
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected to MySQL database via Connection Pool");
    connection.release();
});

/* ================= AUTH ROUTES ================= */

// Register
app.post("/api/register", async(req, res) => {
    console.log("incoming Data:", req.body);
    // CHANGED: Removed 'email' from destructuring
    const { name, university_id, password, role } = req.body;

    // CHANGED: Validation now checks for university_id instead of email
    if (!name || !university_id || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, university_id, password, role)
            VALUES (?, ?, ?, ?)
        `;
        const values = [name, university_id, hashedPassword, role];

        db.query(sql, values, (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    // CHANGED: Error message updated
                    console.log("Duplicate Entry Detected", err.sqlMessage);
                    return res.status(409).json({ error: "Staff/Student ID already exists" });
                }
                console.error(err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json({ success: true });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Login
app.post("/api/login", (req, res) => {
    // CHANGED: Receiving university_id instead of email
    const { university_id, password } = req.body;

    const sql = `SELECT * FROM users WHERE university_id = ?`;

    // CHANGED: Passing university_id to the query
    db.query(sql, [university_id], async(err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) return res.status(401).json({ error: "Invalid ID or password" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(401).json({ error: "Invalid ID or password" });

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                university_id: user.university_id // added for frontend use
            }
        });
    });
});

/* ================= SESSION ROUTES ================= */

// Start session
app.post("/api/sessions", (req, res) => {
    const { unit_code, lecturer_id, latitude, longitude } = req.body;

    if (!unit_code || !lecturer_id || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing session details or GPS location" });
    }

    const token = crypto.randomBytes(16).toString("hex");

    const sql = `
        INSERT INTO sessions (unit_code, lecturer_id, qr_token, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [unit_code, lecturer_id, token, latitude, longitude], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to start session" });
        }

        res.json({
            success: true,
            session_id: result.insertId,
            qr_token: token
        });
    });
});

// Refresh QR token
app.put("/api/sessions/:id/token", (req, res) => {
    const sessionId = req.params.id;
    const newToken = crypto.randomBytes(16).toString("hex");

    const sql = `UPDATE sessions SET qr_token = ? WHERE id = ?`;

    db.query(sql, [newToken, sessionId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to update token" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.json({ success: true, qr_token: newToken });
    });
});

/* ================= ATTENDANCE ROUTES ================= */
// Haversine Formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Meters
}

// Mark attendance
app.post("/api/attendance", (req, res) => {
    const { student_id, session_id, qr_token, latitude, longitude, device_id } = req.body;

    if (!student_id || !session_id || !qr_token || !latitude || !device_id) {
        return res.status(400).json({ error: "Missing verification data" });
    }

    const sessionSql = `SELECT * FROM sessions WHERE id = ?`;

    db.query(sessionSql, [session_id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Session not found" });

        const session = results[0];

        // CHECK 1: Token
        if (session.qr_token !== qr_token) {
            return res.status(403).json({ error: "Invalid or expired QR code" });
        }

        // CHECK 2: GPS
        const distance = getDistanceFromLatLonInKm(session.latitude, session.longitude, latitude, longitude);
        if (distance > 100) {
            return res.status(403).json({
                error: `Too far! You are ${Math.round(distance)}m away.`,
                distance: Math.round(distance), // Send distance so frontend can show it
                lecturer_location: { lat: session.latitude, lon: session.longitude } // Send coords for debugging
            });
        }

        // CHECK 3: Device Fingerprint
        const deviceSql = `SELECT * FROM attendance WHERE session_id = ? AND device_id = ? AND student_id != ?`;

        db.query(deviceSql, [session_id, device_id, student_id], (err, deviceResults) => {
            if (deviceResults.length > 0) {
                return res.status(403).json({ error: "This device has already been used to sign in!" });
            }

            // Insert Record
            const insertSql = `
                INSERT INTO attendance (student_id, session_id, status, device_id)
                VALUES (?, ?, 'Present', ?)
            `;

            db.query(insertSql, [student_id, session_id, device_id], (err) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({ error: "Attendance already marked" });
                    }
                    console.error(err);
                    return res.status(500).json({ error: "Failed to mark attendance" });
                }
                res.json({ success: true, distance: Math.round(distance) });
            });
        });
    });
});

/* ================= HISTORY ROUTES ================= */

// Session attendance list
app.get("/api/sessions/:id/attendance", (req, res) => {
    const sessionId = req.params.id;

    // CHANGED: Replaced 'u.admission_no' with 'u.university_id' to match schema
    const sql = `
        SELECT u.name, u.university_id, a.timestamp 
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE a.session_id = ?
        ORDER BY a.timestamp ASC
    `;

    db.query(sql, [sessionId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

/* ================= UNIT ROUTES ================= */

app.get("/api/units/:lecturer_id", (req, res) => {
    const sql = "SELECT * FROM units WHERE lecturer_id = ?";
    db.query(sql, [req.params.lecturer_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Db error" });
        res.json(results);
    });
});

app.post("/api/units", (req, res) => {
    const { unit_code, unit_name, lecturer_id } = req.body;
    if (!unit_code || !lecturer_id) return res.status(400).json({ error: "Missing details" });

    const sql = "INSERT INTO units (unit_code, unit_name, lecturer_id) VALUES (?, ?, ?)";
    db.query(sql, [unit_code, unit_name, lecturer_id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to add unit" });
        res.json({ success: true });
    });
});

/* ================= SERVER START ================= */
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});