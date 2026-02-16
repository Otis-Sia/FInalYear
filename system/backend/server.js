// server.js
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Store active SSE connections by session ID for QR refresh notifications
const sseConnections = new Map();

/* ================= MIDDLEWARE ================= */
app.use(
    cors({
        origin: true, // OK for school/LAN testing
        credentials: false // you're not using cookies/sessions
    })
);
app.use(express.json());
app.use(express.static(require("path").join(__dirname, "..", "public")));

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
    console.log("Connected to MySQL via Connection Pool");
    connection.release();
});

/* ================= HELPERS ================= */
function logActivity(userId, action, details = null) {
    const sql = "INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)";
    db.query(sql, [userId, action, details], (err) => {
        if (err) console.error("⚠️ Failed to log activity:", err.message);
    });
}

const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";

const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
};

// ... other helpers ...


function distanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
}


function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

function parseBoolToTinyInt(v, defaultTrue = true) {
    // Accept: true/false, 1/0, "1"/"0", "true"/"false"
    if (v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true") return 1;
    if (v === false || v === 0 || v === "0" || String(v).toLowerCase() === "false") return 0;
    return defaultTrue ? 1 : 0;
}

/* ================= ADMIN MIDDLEWARE ================= */
function requireAdmin(req, res, next) {
    const adminId = (req.body && req.body.admin_id) || req.query.admin_id || req.headers['x-admin-id'];

    if (isBlank(adminId)) {
        return res.status(401).json({ error: "Unauthorized: Admin ID required" });
    }

    const sql = "SELECT role FROM users WHERE id = ?";
    db.query(sql, [adminId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: "Unauthorized: Invalid Admin ID" });
        }
        if (normalizeRole(results[0].role) !== 'admin') {
            return res.status(403).json({ error: "Forbidden: Not an admin" });
        }
        next();
    });
}

/* ================= AUTH ROUTES ================= */

/**
 * Register
 * Required: name, university_id, password, role
 * Optional: email (only if your DB supports NULL emails)
 */
app.post("/api/register", async (req, res) => {
    return res.status(403).json({ error: "Public registration is disabled. Please contact an administrator." });
});

/**
 * Login
 * Required: university_id, password
 */
app.post("/api/login", (req, res) => {
    const { university_id, password } = req.body;

    if (isBlank(university_id) || isBlank(password)) {
        return res.status(400).json({ error: "university_id and password are required" });
    }

    const sql = `
    SELECT id, full_name as name, user_id as university_id, password, role
    FROM users
    WHERE user_id = ?
    LIMIT 1
  `;

    db.query(sql, [String(university_id).trim()], async (err, results) => {
        if (err) {
            console.error("Login DB error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (!results || results.length === 0) {
            return res.status(401).json({ error: "Invalid ID or password" });
        }

        const user = results[0];

        try {
            const isMatch = await bcrypt.compare(String(password), user.password);
            if (!isMatch) {
                console.warn("⚠️ [LOGIN] Password mismatch for user:", user.name);
                return res.status(401).json({ error: "Invalid ID or password" });
            }
            console.log("✅ [LOGIN] Success:", user.name, "(Role:", user.role, ")");

            // Log activity
            logActivity(user.id, 'LOGIN', 'User logged in');


            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name, // aliased in query
                    university_id: user.university_id, // aliased in query
                    role: normalizeRole(user.role) // normalize on output so frontend redirect works
                }
            });
        } catch (e) {
            console.error("Login compare error:", e);
            return res.status(500).json({ error: "Server error" });
        }
    });
});

/* ================= UNIT ROUTES ================= */

// List units for a lecturer
app.get("/api/units/:lecturer_id", (req, res) => {
    const lecturerId = toNumber(req.params.lecturer_id);
    if (!Number.isFinite(lecturerId)) return res.status(400).json({ error: "Invalid lecturer_id" });

    const sql = "SELECT id, unit_code, unit_name, lecturer_id FROM units WHERE lecturer_id = ?";
    db.query(sql, [lecturerId], (err, results) => {
        if (err) {
            console.error("Unit list error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results || []);
    });
});

/* ================= SESSION ROUTES ================= */

/**
 * Start session
 * Required: unit_code, lecturer_id
 * Optional: require_gps (default true)
 * If require_gps = 1 -> latitude & longitude REQUIRED
 * If require_gps = 0 -> latitude & longitude can be NULL
 */
app.post("/api/sessions", (req, res) => {
    console.log("👉 [SESSION START] Request:", req.body);
    const { unit_code, lecturer_id, latitude, longitude, require_gps } = req.body;

    if (isBlank(unit_code) || isBlank(lecturer_id)) {
        return res.status(400).json({ error: "Missing unit_code or lecturer_id" });
    }

    const lecturerId = toNumber(lecturer_id);
    if (!Number.isFinite(lecturerId)) return res.status(400).json({ error: "Invalid lecturer_id" });

    const gpsRequired = parseBoolToTinyInt(require_gps, true);

    let lat = null;
    let lon = null;

    if (gpsRequired === 1) {
        if (latitude == null || longitude == null) {
            return res.status(400).json({ error: "GPS required for physical session" });
        }
        lat = toNumber(latitude);
        lon = toNumber(longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return res.status(400).json({ error: "Invalid GPS coordinates" });
        }
    }

    const token = crypto.randomBytes(16).toString("hex");

    const sql = `
    INSERT INTO sessions (unit_code, lecturer_id, qr_token, latitude, longitude, is_active, require_gps)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `;

    db.query(sql, [String(unit_code).trim(), lecturerId, token, lat, lon, gpsRequired], (err, result) => {
        if (err) {
            console.error("❌ [SESSION START] DB Error:", err);
            return res.status(500).json({ error: "Failed to start session: " + err.message });
        }
        console.log("✅ [SESSION START] Success! ID:", result.insertId);
        res.json({
            success: true,
            session_id: result.insertId,
            qr_token: token,
            require_gps: gpsRequired
        });
    });
});

/**
 * Refresh QR token (requires lecturer_id; ownership enforced)
 */
app.put("/api/sessions/:id/token", (req, res) => {
    const sessionId = toNumber(req.params.id);
    const { lecturer_id } = req.body;

    if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "Invalid session id" });
    if (isBlank(lecturer_id)) return res.status(400).json({ error: "lecturer_id required" });

    const lecturerId = toNumber(lecturer_id);
    if (!Number.isFinite(lecturerId)) return res.status(400).json({ error: "Invalid lecturer_id" });

    const newToken = crypto.randomBytes(16).toString("hex");

    const sql = `
    UPDATE sessions
    SET qr_token = ?
    WHERE id = ? AND lecturer_id = ? AND is_active = 1
  `;

    db.query(sql, [newToken, sessionId, lecturerId], (err, result) => {
        if (err) {
            console.error("Token refresh error:", err);
            return res.status(500).json({ error: "Failed to update token" });
        }
        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "Not allowed, session ended, or session not found" });
        }
        res.json({ success: true, qr_token: newToken });
    });
});

/**
 * End session (requires lecturer_id; ownership enforced)
 */
app.put("/api/sessions/:id/end", (req, res) => {
    const sessionId = toNumber(req.params.id);
    const { lecturer_id } = req.body;

    if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "Invalid session id" });
    if (isBlank(lecturer_id)) return res.status(400).json({ error: "lecturer_id required" });

    const lecturerId = toNumber(lecturer_id);
    if (!Number.isFinite(lecturerId)) return res.status(400).json({ error: "Invalid lecturer_id" });

    const sql = `
    UPDATE sessions
    SET is_active = 0, ended_at = CURRENT_TIMESTAMP
    WHERE id = ? AND lecturer_id = ? AND is_active = 1
  `;

    db.query(sql, [sessionId, lecturerId], (err, result) => {
        if (err) {
            console.error("End session error:", err);
            return res.status(500).json({ error: "Failed to end session" });
        }
        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "Not allowed, session already ended, or session not found" });
        }
        res.json({ success: true });
    });
});

/**
 * SSE endpoint for QR refresh notifications
 * Allows admin QR page to receive real-time events when attendance is marked
 */
app.get("/api/sessions/:id/events", (req, res) => {
    const sessionId = toNumber(req.params.id);

    if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "Invalid session id" });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial comment to establish connection
    res.write(': connected\n\n');

    // Store connection
    if (!sseConnections.has(sessionId)) {
        sseConnections.set(sessionId, []);
    }
    sseConnections.get(sessionId).push(res);

    console.log(`✅ [SSE] Client connected for session ${sessionId}. Active connections: ${sseConnections.get(sessionId).length}`);

    // Remove on disconnect
    req.on('close', () => {
        const connections = sseConnections.get(sessionId) || [];
        const index = connections.indexOf(res);
        if (index !== -1) {
            connections.splice(index, 1);
            console.log(`❌ [SSE] Client disconnected from session ${sessionId}. Remaining: ${connections.length}`);
        }
        if (connections.length === 0) {
            sseConnections.delete(sessionId);
        }
    });
});

/* ================= ATTENDANCE ROUTES ================= */

/**
 * Mark attendance
 * Required: student_id, session_id, qr_token, device_id
 * GPS required only if session.require_gps = 1
 */
app.post("/api/attendance", (req, res) => {
    console.log("👉 [ATTENDANCE] Request:", req.body);
    const { student_id, session_id, qr_token, latitude, longitude, device_id } = req.body;

    if (isBlank(student_id) || isBlank(session_id) || isBlank(qr_token) || isBlank(device_id)) {
        return res.status(400).json({ error: "Missing verification data" });
    }

    const studentId = toNumber(student_id);
    const sessionId = toNumber(session_id);

    if (!Number.isFinite(studentId) || !Number.isFinite(sessionId)) {
        return res.status(400).json({ error: "Invalid IDs" });
    }

    const sessionSql = `
    SELECT id, lecturer_id, qr_token, is_active, latitude, longitude, require_gps
    FROM sessions
    WHERE id = ?
    LIMIT 1
  `;

    db.query(sessionSql, [sessionId], (err, results) => {
        if (err) {
            console.error("Session lookup error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        const session = results[0];

        if (!session.is_active) {
            return res.status(403).json({ error: "Session is not active" });
        }

        if (session.qr_token !== String(qr_token)) {
            console.warn("⚠️ [ATTENDANCE] Invalid QR Token. Received:", qr_token, "Expected:", session.qr_token);
            return res.status(403).json({ error: "Invalid or expired QR code" });
        }

        // 1) One attendance per student per session (unique constraint also helps)
        const alreadySql = `SELECT id FROM attendance WHERE session_id = ? AND student_id = ? LIMIT 1`;
        db.query(alreadySql, [sessionId, studentId], (err2, already) => {
            if (err2) {
                console.error("Attendance precheck error:", err2);
                return res.status(500).json({ error: "Database error" });
            }
            if (already && already.length > 0) {
                return res.status(409).json({ error: "Attendance already marked" });
            }

            // 2) Device restriction: device can sign only ONE different student per session
            const deviceSql = `
        SELECT id FROM attendance
        WHERE session_id = ? AND device_id = ? AND student_id <> ?
        LIMIT 1
      `;
            db.query(deviceSql, [sessionId, String(device_id), studentId], (err3, deviceResults) => {
                if (err3) {
                    console.error("Device check error:", err3);
                    return res.status(500).json({ error: "Database error" });
                }
                if (deviceResults && deviceResults.length > 0) {
                    return res.status(403).json({ error: "This device has already been used to sign in another student!" });
                }

                // 3) GPS enforcement only if required by session
                const gpsRequired = Number(session.require_gps) === 1;
                let dist = 0;

                if (gpsRequired) {
                    if (latitude == null || longitude == null) {
                        return res.status(400).json({ error: "GPS is required for this session" });
                    }

                    const lat = toNumber(latitude);
                    const lon = toNumber(longitude);

                    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                        return res.status(400).json({ error: "Invalid GPS coordinates" });
                    }

                    if (session.latitude == null || session.longitude == null) {
                        return res.status(500).json({ error: "Session GPS not set correctly" });
                    }

                    dist = distanceMeters(
                        toNumber(session.latitude),
                        toNumber(session.longitude),
                        lat,
                        lon
                    );

                    if (dist > 100) {
                        console.warn(`⚠️ [ATTENDANCE] GPS too far: ${dist}m > 100m`);
                        return res.status(433).json({
                            error: `Too far! You are ${Math.round(dist)}m away.`,
                            distance: Math.round(dist),
                            lecturer_location: { lat: Number(session.latitude), lon: Number(session.longitude) }
                        });
                    }
                }

                // 4) Insert attendance
                const insertSql = `
          INSERT INTO attendance (student_id, session_id, status, device_id)
          VALUES (?, ?, 'Present', ?)
        `;

                db.query(insertSql, [studentId, sessionId, String(device_id)], (err4) => {
                    if (err4) {
                        if (err4.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({ error: "Attendance already marked" });
                        }
                        console.error("Insert attendance error:", err4);
                        return res.status(500).json({ error: "Failed to mark attendance" });
                    }

                    // Emit SSE event to all connected clients for this session
                    const connections = sseConnections.get(sessionId) || [];
                    if (connections.length > 0) {
                        const eventData = JSON.stringify({ type: 'attendance_marked', sessionId });
                        connections.forEach(client => {
                            try {
                                client.write(`data: ${eventData}\n\n`);
                            } catch (writeErr) {
                                console.error("SSE write error:", writeErr.message);
                            }
                        });
                        console.log(`📡 [SSE] Notified ${connections.length} client(s) for session ${sessionId}`);
                    }

                    return res.json({ success: true, distance: Math.round(dist) });
                });
            });
        });
    });
});

/* ================= HISTORY ROUTES ================= */

/**
 * Attendance list for a session
 * NOTE: for stronger security you should protect this (JWT).
 * For now, it's open (your frontend hides it behind lecturer role checks).
 */
app.get("/api/sessions/:id/attendance", (req, res) => {
    const sessionId = toNumber(req.params.id);
    if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "Invalid session id" });

    const sql = `
    SELECT u.full_name as name, u.user_id as university_id, a.timestamp, a.status
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    WHERE a.session_id = ?
    ORDER BY a.timestamp ASC
  `;

    db.query(sql, [sessionId], (err, results) => {
        if (err) {
            console.error("Session attendance list error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results || []);
    });
});

/**
 * Lecturer history: list sessions + attendance count
 */
app.get("/api/history/lecturer/:lecturer_id/sessions", (req, res) => {
    const lecturerId = toNumber(req.params.lecturer_id);
    if (!Number.isFinite(lecturerId)) return res.status(400).json({ error: "Invalid lecturer_id" });

    const sql = `
    SELECT
      s.id AS session_id,
      s.unit_code,
      s.created_at,
      s.ended_at,
      s.is_active,
      s.require_gps,
      COUNT(a.id) AS attended_count
    FROM sessions s
    LEFT JOIN attendance a ON a.session_id = s.id
    WHERE s.lecturer_id = ?
    GROUP BY s.id, s.unit_code, s.created_at, s.ended_at, s.is_active, s.require_gps
    ORDER BY s.created_at DESC
    LIMIT 200
  `;

    db.query(sql, [lecturerId], (err, results) => {
        if (err) {
            console.error("Lecturer history sessions error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results || []);
    });
});

/**
 * Student history: list sessions attended by the student
 */
app.get("/api/history/student/:student_id/attended", (req, res) => {
    const studentId = toNumber(req.params.student_id);
    if (!Number.isFinite(studentId)) return res.status(400).json({ error: "Invalid student_id" });

    const sql = `
    SELECT
      a.timestamp AS attended_at,
      s.id AS session_id,
      s.unit_code,
      s.created_at AS session_started_at,
      s.ended_at AS session_ended_at,
      s.require_gps
    FROM attendance a
    JOIN sessions s ON s.id = a.session_id
    WHERE a.student_id = ?
    ORDER BY a.timestamp DESC
    LIMIT 200
  `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Student history attended error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results || []);
    });
});

/* ================= ADMIN ROUTES ================= */

// List all users
app.get("/api/admin/users", requireAdmin, (req, res) => {
    console.log("👉 [ADMIN] Fetching users. Admin ID:", req.query.admin_id || req.headers['x-admin-id']);
    const sql = `
        SELECT u.id, u.full_name, u.user_id, u.email, u.role, u.created_at,
        (SELECT MAX(timestamp) FROM activity_logs WHERE user_id = u.id) as last_seen
        FROM users u
        ORDER BY last_seen DESC, u.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ [ADMIN] Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        // Normalize roles for display
        const users = results.map(u => ({ ...u, role: normalizeRole(u.role) }));
        res.json(users);
    });
});

// Create user (Admin only)
app.post("/api/admin/users", requireAdmin, async (req, res) => {
    const { name, university_id, password, role, email } = req.body || {};

    if (isBlank(name) || isBlank(university_id) || isBlank(password) || isBlank(role)) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const normalizedRole = normalizeRole(role);
    if (!["student", "lecturer", "admin"].includes(normalizedRole)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    try {
        const hashedPassword = await bcrypt.hash(String(password), 10);
        const hasEmail = !isBlank(email);

        const sql = hasEmail ?
            `INSERT INTO users (full_name, user_id, email, password, role) VALUES (?, ?, ?, ?, ?)` :
            `INSERT INTO users (full_name, user_id, password, role) VALUES (?, ?, ?, ?)`;

        const values = hasEmail ?
            [String(name).trim(), String(university_id).trim(), String(email).trim(), hashedPassword, normalizedRole] :
            [String(name).trim(), String(university_id).trim(), hashedPassword, normalizedRole];

        db.query(sql, values, (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "User already exists" });
                return res.status(500).json({ error: "Database error" });
            }
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Delete user
app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
    const userId = toNumber(req.params.id);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: "Invalid ID" });

    // Prevent self-deletion ideally, but keep it simple
    if (userId === Number(req.body.admin_id) || userId === Number(req.query.admin_id)) {
        return res.status(400).json({ error: "Cannot delete yourself" });
    }

    db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true });
    });
});

// List all units
app.get("/api/admin/units", requireAdmin, (req, res) => {
    const sql = `
        SELECT u.id, u.unit_code, u.unit_name, u.lecturer_id, l.full_name as lecturer_name 
        FROM units u
        LEFT JOIN users l ON u.lecturer_id = l.id
        ORDER BY u.unit_code ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// Create Unit (Admin)
app.post("/api/admin/units", requireAdmin, (req, res) => {
    const { unit_code, unit_name, lecturer_id } = req.body || {};
    if (isBlank(unit_code) || isBlank(unit_name)) return res.status(400).json({ error: "Missing info" });

    // Lecturer ID can be null if not assigned yet? Schema says user can be null. 
    // Schema: lecturer_id INT, foreign key.
    const lectId = lecturer_id ? toNumber(lecturer_id) : null;

    const sql = "INSERT INTO units (unit_code, unit_name, lecturer_id) VALUES (?, ?, ?)";
    db.query(sql, [unit_code, unit_name, lectId], (err) => {
        if (err) return res.status(500).json({ error: "Database error (check lecturer ID)" });
        res.json({ success: true });
    });
});

// Delete Unit
app.delete("/api/admin/units/:id", requireAdmin, (req, res) => {
    const unitId = toNumber(req.params.id);
    db.query("DELETE FROM units WHERE id = ?", [unitId], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true });
    });
});

// Get Lecturers (for dropdowns)
app.get("/api/admin/lecturers", requireAdmin, (req, res) => {
    db.query("SELECT id, full_name, user_id FROM users WHERE role = 'lecturer'", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results || []);
    });
});

/* ================= SERVER START ================= */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});