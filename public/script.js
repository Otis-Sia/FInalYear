/* ================= CONFIG ================= */

const CONFIG = {
    API_BASE: "/api", // same-origin: works on lecturer IP:3000 and localhost
    QR_REFRESH_RATE_MS: 6000, // set 5000 if you want 5 seconds instead
    QR_CODE_SIZE: 300,
    GPS_TIMEOUT_STUDENT_MS: 10000,
    GPS_TIMEOUT_LECTURER_MS: 15000,
};

const el = (id) => document.getElementById(id);

/* ================= API HELPER ================= */

async function apiFetch(path, options = {}) {
    const res = await fetch(`${CONFIG.API_BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });

    let data = null;
    try {
        data = await res.json();
    } catch (_) {}

    if (!res.ok) {
        const msg = data?.error || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return data;
}

/* ================= GPS ================= */

function getPositionWithTimeout(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("GPS not supported by this browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => {
                let msg = "Unknown GPS error";
                if (err.code === 1) msg = "Permission denied. Allow location access.";
                if (err.code === 2) msg = "Position unavailable. Move to an open area.";
                if (err.code === 3) msg = "GPS timeout. Signal too weak.";
                reject(new Error(msg));
            }, { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
        );
    });
}

/* ================= DEVICE IDENTIFIER (DEMO) ================= */

function getDeviceId() {
    let deviceId = localStorage.getItem("device_identifier");
    if (!deviceId) {
        deviceId =
            "DEV-" +
            Math.random().toString(36).slice(2, 10).toUpperCase() +
            "-" +
            Date.now().toString(36).toUpperCase();
        localStorage.setItem("device_identifier", deviceId);
    }
    return deviceId;
}

/* ================= AUTH HELPERS ================= */

function getUser() {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem("user");
        return null;
    }
}

function requireAuth() {
    const user = getUser();
    if (!user) {
        window.location.href = "index.html";
        return null;
    }
    return user;
}

function requireRole(expectedRole) {
    const user = requireAuth();
    if (!user) return null;

    const role = String(user.role || "").trim().toLowerCase();
    if (role !== expectedRole) {
        window.location.href = role === "lecturer" ? "registerSessions.html" : "atendeeScan.html";
        return null;
    }
    return user;
}

/* ================= UI HELPERS ================= */

function updateStatus(icon, text, color) {
    if (!el("status-title") || !el("status-msg")) return;
    el("status-title").innerText =
        icon + " " + (color === "green" ? "Success" : color === "red" ? "Failed" : "Processing");
    el("status-msg").innerText = text;
    el("status-title").style.color = color;
}

/* ================= MAIN ================= */

document.addEventListener("DOMContentLoaded", () => {
    /* ========== GLOBAL: LOGOUT BUTTON ========== */
    if (el("logout-btn")) {
        el("logout-btn").addEventListener("click", () => {
            localStorage.removeItem("user");
            window.location.href = "index.html";
        });
    }

    /* ================= 1) LOGIN & REGISTER ================= */
    if (el("auth-form")) {
        let isLoginMode = true;

        el("toggle-link").addEventListener("click", (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;

            el("form-title").innerText = isLoginMode ? "Login" : "Register";
            el("submit-btn").innerText = isLoginMode ? "Sign In" : "Create Account";
            el("toggle-text").innerText = isLoginMode ? "New here?" : "Already have an account?";
            el("toggle-link").innerText = isLoginMode ? "Create Account" : "Back to Login";

            el("name-group").classList.toggle("hidden", isLoginMode);
            el("role-group").classList.toggle("hidden", isLoginMode);

            if (isLoginMode) {
                el("full_name").removeAttribute("required");
                el("role").removeAttribute("required");
            } else {
                el("full_name").setAttribute("required", "true");
                el("role").setAttribute("required", "true");
            }
        });

        el("auth-form").addEventListener("submit", async(e) => {
            e.preventDefault();

            const btn = el("submit-btn");
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerText = "Processing...";

            try {
                const university_id = el("university_id").value.trim();
                const password = el("password").value;

                if (!university_id || !password) throw new Error("Please enter your ID and password.");

                if (isLoginMode) {
                    const data = await apiFetch("/login", {
                        method: "POST",
                        body: JSON.stringify({ university_id, password }),
                    });

                    localStorage.setItem("user", JSON.stringify(data.user));

                    const role = String(data.user.role || "").trim().toLowerCase();
                    window.location.href = role === "lecturer" ? "registerSessions.html" : "atendeeScan.html";
                } else {
                    const name = el("full_name").value.trim();
                    const role = el("role").value; // should be lowercase values in HTML: student/lecturer

                    if (!name || !role) throw new Error("Please enter your name and role.");

                    await apiFetch("/register", {
                        method: "POST",
                        body: JSON.stringify({ name, university_id, password, role }),
                    });

                    alert("Registration successful! Please login.");
                    location.reload();
                }
            } catch (err) {
                alert(err.message);
                btn.disabled = false;
                btn.innerText = originalText;
            }
        });
    }

    /* ================= 2) LECTURER DASHBOARD ================= */
    if (el("unit-select")) {
        const user = requireRole("lecturer");
        if (!user) return;

        async function loadUnits() {
            const select = el("unit-select");
            select.innerHTML = `<option value="" disabled selected>Loading units...</option>`;

            try {
                const units = await apiFetch(`/units/${user.id}`, { method: "GET" });
                select.innerHTML = `<option value="" disabled selected>-- Select Unit --</option>`;

                if (!units.length) {
                    select.innerHTML += `<option disabled>No units found. Add one below.</option>`;
                    return;
                }

                for (const u of units) {
                    const opt = document.createElement("option");
                    opt.value = u.unit_code;
                    opt.innerText = `${u.unit_code} - ${u.unit_name}`;
                    select.appendChild(opt);
                }
            } catch {
                select.innerHTML = `<option disabled>Error loading units</option>`;
            }
        }

        loadUnits();

        if (el("add-unit-btn")) {
            el("add-unit-btn").addEventListener("click", async() => {
                const code = el("new-code").value.trim();
                const name = el("new-name").value.trim();
                if (!code || !name) return alert("Please fill in both Code and Name");

                try {
                    await apiFetch("/units", {
                        method: "POST",
                        body: JSON.stringify({ unit_code: code, unit_name: name, lecturer_id: user.id }),
                    });

                    alert("Unit Added!");
                    el("new-code").value = "";
                    el("new-name").value = "";
                    loadUnits();
                } catch (err) {
                    alert(err.message);
                }
            });
        }

        el("start-btn").addEventListener("click", async() => {
            const unit = el("unit-select").value;
            if (!unit) return alert("Select a unit first");

            const btn = el("start-btn");
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerText = "📍 Acquiring GPS...";

            try {
                const pos = await getPositionWithTimeout(CONFIG.GPS_TIMEOUT_LECTURER_MS);
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                btn.innerText = "🚀 Starting Session...";

                const data = await apiFetch("/sessions", {
                    method: "POST",
                    body: JSON.stringify({ unit_code: unit, lecturer_id: user.id, latitude: lat, longitude: lon }),
                });

                window.location.href = `adminQR.html?session=${data.session_id}&unit=${encodeURIComponent(unit)}`;
            } catch (err) {
                alert("Error starting session: " + err.message);
                btn.disabled = false;
                btn.innerText = originalText;
            }
        });
    }

    /* ================= 3) ADMIN QR PAGE ================= */
    if (el("qrcode-container")) {
        const user = requireRole("lecturer");
        if (!user) return;

        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session");
        const unit = params.get("unit");

        if (!sessionId) {
            alert("Missing session id.");
            window.location.href = "registerSessions.html";
            return;
        }

        if (el("class-title")) el("class-title").innerText = unit || "Live Class";

        const qr = new QRCode(el("qrcode-container"), {
            width: CONFIG.QR_CODE_SIZE,
            height: CONFIG.QR_CODE_SIZE,
        });

        const refreshEverySec = Math.max(1, Math.round(CONFIG.QR_REFRESH_RATE_MS / 1000));
        let countdown = refreshEverySec;

        async function updateQR() {
            try {
                const data = await apiFetch(`/sessions/${sessionId}/token`, {
                    method: "PUT",
                    body: JSON.stringify({ lecturer_id: user.id }),
                });

                const payload = JSON.stringify({ sid: sessionId, tok: data.qr_token });
                qr.makeCode(payload);
            } catch (err) {
                console.error("Token refresh error:", err.message);
            }
        }

        updateQR();

        const timerInterval = setInterval(() => {
            countdown--;
            if (el("timer")) el("timer").innerText = String(countdown);

            if (countdown <= 0) {
                updateQR();
                countdown = refreshEverySec;
            }
        }, 1000);

        if (el("end-btn")) {
            el("end-btn").onclick = async() => {
                try {
                    await apiFetch(`/sessions/${sessionId}/end`, {
                        method: "PUT",
                        body: JSON.stringify({ lecturer_id: user.id }),
                    });
                } catch (err) {
                    alert(err.message);
                } finally {
                    clearInterval(timerInterval);
                    window.location.href = "registerSessions.html";
                }
            };
        }

        if (el("monitor-btn")) {
            el("monitor-btn").onclick = () => {
                window.open(`attendance.html?session=${sessionId}`, "_blank");
            };
        }
    }

    /* ================= 4) STUDENT SCANNER PAGE ================= */
    if (el("reader")) {
        const user = requireRole("student");
        if (!user) return;

        const isLocalhost =
            window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

        if (window.location.protocol !== "https:" && !isLocalhost) {
            // Not blocking, just warning
            alert("⚠️ GPS may fail because this site is not HTTPS. Use chrome flags or HTTPS if needed.");
        }

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: 250,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        });

        scanner.render(onScanSuccess);

        function onScanSuccess(decodedText) {
            scanner.clear();
            el("reader").style.display = "none";
            handleAttendance(decodedText);
        }

        async function handleAttendance(qrJsonString) {
            // Validate QR before GPS
            let qrData;
            try {
                qrData = JSON.parse(qrJsonString);
                if (!qrData.sid || !qrData.tok) throw new Error("Invalid QR payload");
            } catch {
                if (el("result-area")) el("result-area").classList.remove("hidden");
                updateStatus("❌", "Invalid QR. Please scan the Class QR.", "red");
                if (el("retry-btn")) el("retry-btn").classList.remove("hidden");
                return;
            }

            if (el("result-area")) el("result-area").classList.remove("hidden");
            if (el("debug-info")) el("debug-info").innerHTML = "";

            updateStatus("⏳", "QR validated. Acquiring GPS...", "orange");

            try {
                const pos = await getPositionWithTimeout(CONFIG.GPS_TIMEOUT_STUDENT_MS);
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                updateStatus("📡", "Sending to server...", "blue");

                const payload = {
                    student_id: user.id,
                    session_id: qrData.sid,
                    qr_token: qrData.tok,
                    latitude: lat,
                    longitude: lon,
                    device_id: getDeviceId(),
                };

                const data = await apiFetch("/attendance", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                if (el("debug-info")) {
                    let html = `<strong>You:</strong> ${lat.toFixed(5)}, ${lon.toFixed(5)}<br>`;
                    if (data.distance !== undefined) html += `<strong>Distance:</strong> ${data.distance} meters<br>`;
                    if (data.lecturer_location) {
                        html += `<strong>Class:</strong> ${data.lecturer_location.lat.toFixed(5)}, ${data.lecturer_location.lon.toFixed(5)}`;
                    }
                    el("debug-info").innerHTML = html;
                }

                updateStatus("✅", `Attendance marked! (${data.distance}m)`, "green");
                if (el("retry-btn")) el("retry-btn").classList.add("hidden");
            } catch (err) {
                updateStatus("❌", err.message, "red");
                if (el("retry-btn")) el("retry-btn").classList.remove("hidden");
            }
        }

        if (el("retry-btn")) el("retry-btn").onclick = () => window.location.reload();
    }

    /* ================= 5) ATTENDANCE LIST PAGE (LECTURER ONLY) ================= */
    if (el("attendance-list")) {
        const user = requireRole("lecturer");
        if (!user) return;

        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session");

        if (!sessionId) return;

        async function refreshAttendance() {
            try {
                const data = await apiFetch(`/sessions/${sessionId}/attendance`, { method: "GET" });

                if (el("count")) el("count").innerText = String(data.length);

                const list = el("attendance-list");
                list.innerHTML = "";

                for (const r of data) {
                    list.innerHTML += `
            <tr>
              <td>${r.name}</td>
              <td>${r.university_id || ""}</td>
              <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
            </tr>`;
                }
            } catch (err) {
                console.error("Attendance list error:", err.message);
            }
        }

        refreshAttendance();
        setInterval(refreshAttendance, 3000);
    }

    /* ================= 6) HISTORY PAGE (ROLE-BASED) ================= */
    if (document.getElementById("lecturer-panel") || document.getElementById("student-panel")) {
        const user = requireAuth();
        if (!user) return;

        const role = String(user.role || "").trim().toLowerCase();

        const showError = (msg) => {
            const box = document.getElementById("history-error");
            if (!box) return;
            box.classList.remove("hidden");
            box.textContent = msg;
        };

        function downloadCSV(filename, rows) {
            // rows: array of objects
            const cols = rows.length ? Object.keys(rows[0]) : [];
            const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

            const header = cols.map(escape).join(",");
            const lines = rows.map((r) => cols.map((c) => escape(r[c])).join(","));
            const csv = [header, ...lines].join("\n");

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
        }

        function fmtDate(d) {
            if (!d) return "";
            const date = new Date(d);
            return isNaN(date.getTime()) ? String(d) : date.toLocaleString();
        }

        // Lecturer view
        async function loadLecturerHistory() {
            document.getElementById("lecturer-panel").classList.remove("hidden");
            document.getElementById("history-title").textContent = "👨‍🏫 Lecturer History";
            document.getElementById("history-subtitle").textContent = "Your previous sessions and attendance lists.";

            const sessions = await apiFetch(`/history/lecturer/${user.id}/sessions`, { method: "GET" });

            const body = document.getElementById("lecturer-sessions-body");
            body.innerHTML = "";

            sessions.forEach((s) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
        <td>${s.session_id}</td>
        <td>${s.unit_code}</td>
        <td>${fmtDate(s.created_at)}</td>
        <td>${fmtDate(s.ended_at)}</td>
        <td>${s.is_active ? "Yes" : "No"}</td>
        <td>${s.attended_count}</td>
        <td>
          <button class="btn" data-view-session="${s.session_id}" style="width:auto; padding:8px 10px; margin:0;">View</button>
          <a class="btn-secondary btn" href="attendance.html?session=${encodeURIComponent(s.session_id)}"
             style="width:auto; padding:8px 10px; margin:0; background:#6c757d;">Live</a>
        </td>
      `;
                body.appendChild(tr);
            });

            // Export sessions list
            document.getElementById("export-sessions-btn").onclick = () => {
                downloadCSV("lecturer_sessions.csv", sessions.map((s) => ({
                    session_id: s.session_id,
                    unit_code: s.unit_code,
                    created_at: s.created_at,
                    ended_at: s.ended_at,
                    is_active: s.is_active,
                    attended_count: s.attended_count,
                })));
            };

            // Click handlers for "View"
            body.addEventListener("click", async(e) => {
                const btn = e.target.closest("[data-view-session]");
                if (!btn) return;
                const sessionId = btn.getAttribute("data-view-session");

                try {
                    const attendance = await apiFetch(`/sessions/${sessionId}/attendance`, { method: "GET" });

                    document.getElementById("details-session-id").textContent = sessionId;
                    document.getElementById("lecturer-session-details").classList.remove("hidden");

                    const abody = document.getElementById("lecturer-attendance-body");
                    abody.innerHTML = "";
                    attendance.forEach((a) => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
            <td>${a.name}</td>
            <td>${a.university_id || ""}</td>
            <td>${fmtDate(a.timestamp)}</td>
            <td>${a.status || ""}</td>
          `;
                        abody.appendChild(tr);
                    });

                    document.getElementById("export-attendance-btn").onclick = () => {
                        downloadCSV(`session_${sessionId}_attendance.csv`, attendance.map((a) => ({
                            name: a.name,
                            university_id: a.university_id,
                            timestamp: a.timestamp,
                            status: a.status,
                        })));
                    };
                } catch (err) {
                    showError(err.message);
                }
            }, { once: true });
        }

        // Student view
        async function loadStudentHistory() {
            document.getElementById("student-panel").classList.remove("hidden");
            document.getElementById("history-title").textContent = "🎓 My Attendance History";
            document.getElementById("history-subtitle").textContent = "Sessions you attended (your view only).";

            const attended = await apiFetch(`/history/student/${user.id}/attended`, { method: "GET" });

            const body = document.getElementById("student-attended-body");
            body.innerHTML = "";

            attended.forEach((r) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
        <td>${r.unit_code}</td>
        <td>${r.session_id}</td>
        <td>${fmtDate(r.session_started_at)}</td>
        <td>${fmtDate(r.session_ended_at)}</td>
        <td>${fmtDate(r.attended_at)}</td>
      `;
                body.appendChild(tr);
            });

            document.getElementById("export-attended-btn").onclick = () => {
                downloadCSV("my_attendance_history.csv", attended.map((r) => ({
                    unit_code: r.unit_code,
                    session_id: r.session_id,
                    session_started_at: r.session_started_at,
                    session_ended_at: r.session_ended_at,
                    attended_at: r.attended_at,
                })));
            };
        }

        // Run
        (async() => {
            try {
                if (role === "lecturer") await loadLecturerHistory();
                else if (role === "student") await loadStudentHistory();
                else showError("Unknown role. Please log in again.");
            } catch (err) {
                showError(err.message);
            }
        })();
    }

});