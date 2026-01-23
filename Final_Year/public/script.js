/* ================= CONFIG & UTILITIES ================= */

// 1. GLOBAL GPS HELPER (Robust Promise-based GPS)
function getPositionWithTimeout(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("GPS not supported by this browser."));
        }

        const options = {
            enableHighAccuracy: true, // Critical for attendance precision
            timeout: timeoutMs,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => {
                let msg = "Unknown GPS Error";
                switch (err.code) {
                    case 1:
                        msg = "Permission Denied. Please allow location access.";
                        break;
                    case 2:
                        msg = "Position Unavailable. Move to an open area (outdoors).";
                        break;
                    case 3:
                        msg = "GPS Timeout. Signal too weak.";
                        break;
                }
                reject(new Error(msg));
            },
            options
        );
    });
}

const getApiUrl = () => {
    // 1. Get the protocol (http: or https:)
    const protocol = window.location.protocol;
    // 2. Get the hostname (localhost, 192.168.0.15, etc.)
    const host = window.location.hostname;
    // 3. Return the combined URL with your backend port (e.g., 3000)
    return `${protocol}//${host}:3000`;
};

const CONFIG = {
    API_URL: getApiUrl() + "/api",
    QR_REFRESH_RATE: 5000 // 5 seconds
};

const el = (id) => document.getElementById(id);

// 2. DEVICE FINGERPRINTING UTILITY
function getDeviceId() {
    let deviceId = localStorage.getItem("device_fingerprint");
    if (!deviceId) {
        deviceId = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase() + Date.now().toString(36);
        localStorage.setItem("device_fingerprint", deviceId);
    }
    return deviceId;
}

// Helper: Redirect if not logged in
function requireAuth() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "index.html";
        return null;
    }
    return user;
}

/* ================= MAIN CONTROLLER ================= */
document.addEventListener("DOMContentLoaded", () => {

    /* ================= 1. LOGIN & REGISTER ================= */
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

            // Prevent Double Submission
            const btn = el("submit-btn");
            btn.disabled = true;
            btn.innerText = "Processing...";

            const payload = {
                university_id: el("university_id").value,
                password: el("password").value
            };

            let endpoint = "/login";
            if (!isLoginMode) {
                payload.name = el("full_name").value;
                payload.role = el("role").value;
                endpoint = "/register";
            }

            try {
                const res = await fetch(`${CONFIG.API_URL}${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Auth Failed");

                if (!isLoginMode) {
                    alert("Registration successful! Please login.");
                    location.reload();
                    return;
                }

                localStorage.setItem("user", JSON.stringify(data.user));
                window.location.href = data.user.role === 'lecturer' ? "registerSessions.html" : "atendeeScan.html";

            } catch (err) {
                alert(err.message);
                btn.disabled = false;
                btn.innerText = isLoginMode ? "Sign In" : "Create Account";
            }
        });
    }

    /* ================= 2. LECTURER DASHBOARD (Updated GPS) ================= */
    if (el("unit-select")) {
        const user = requireAuth();
        if (user) {

            // A. FETCH UNITS ON LOAD
            const loadUnits = async() => {
                const select = el("unit-select");
                try {
                    const res = await fetch(`${CONFIG.API_URL}/units/${user.id}`);
                    const units = await res.json();
                    select.innerHTML = `<option value="" disabled selected>-- Select Unit --</option>`;
                    if (units.length === 0) select.innerHTML += `<option disabled>No units found. Add one below.</option>`;
                    units.forEach(u => {
                        const opt = document.createElement("option");
                        opt.value = u.unit_code;
                        opt.innerText = `${u.unit_code} - ${u.unit_name}`;
                        select.appendChild(opt);
                    });
                } catch (err) {
                    select.innerHTML = `<option disabled>Error loading units</option>`;
                }
            };
            loadUnits();

            // B. ADD UNIT BUTTON LOGIC
            if (el("add-unit-btn")) {
                el("add-unit-btn").addEventListener("click", async() => {
                    const code = el("new-code").value;
                    const name = el("new-name").value;
                    if (!code || !name) return alert("Please fill in both Code and Name");
                    try {
                        const res = await fetch(`${CONFIG.API_URL}/units`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ unit_code: code, unit_name: name, lecturer_id: user.id })
                        });
                        if (res.ok) {
                            alert("Unit Added!");
                            el("new-code").value = "";
                            el("new-name").value = "";
                            loadUnits();
                        } else {
                            alert("Failed to add unit.");
                        }
                    } catch (err) {
                        alert("Server error: " + err.message);
                    }
                });
            }

            // C. START CLASS BUTTON (UPDATED: Uses Robust GPS Helper)
            el("start-btn").addEventListener("click", async() => {
                const unit = el("unit-select").value;
                const btn = el("start-btn");

                if (!unit) return alert("Select a unit first");

                // UI Feedback
                const originalText = btn.innerText;
                btn.innerText = "📍 Acquiring GPS...";
                btn.disabled = true;

                try {
                    // 1. Get Location using Global Helper
                    const position = await getPositionWithTimeout(15000); // 15s timeout for lecturer
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    btn.innerText = "🚀 Starting Session...";

                    // 2. Send to Backend
                    const res = await fetch(`${CONFIG.API_URL}/sessions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            unit_code: unit,
                            lecturer_id: user.id,
                            latitude: lat,
                            longitude: lon
                        })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    window.location.href = `adminQR.html?session=${data.session_id}&unit=${unit}`;

                } catch (err) {
                    alert("Error starting session: " + err.message);
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            });
        }
    }

    /* ================= 3. ADMIN QR PAGE ================= */
    if (el("qrcode-container")) {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session");
        el("class-title").innerText = params.get("unit") || "Live Class";

        const qr = new QRCode(el("qrcode-container"), { width: 300, height: 300 });
        let countdown = 5;

        const updateQR = async() => {
            try {
                const res = await fetch(`${CONFIG.API_URL}/sessions/${sessionId}/token`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();
                if (res.ok) {
                    const qrPayload = JSON.stringify({ sid: sessionId, tok: data.qr_token });
                    qr.makeCode(qrPayload);
                }
            } catch (err) {
                console.error("Token refresh error", err);
            }
        };

        updateQR();

        const timerInterval = setInterval(() => {
            countdown--;
            if (el("timer")) el("timer").innerText = countdown;
            if (countdown <= 0) {
                updateQR();
                countdown = 5;
            }
        }, 1000);

        el("end-btn").onclick = () => {
            clearInterval(timerInterval);
            window.location.href = "registerSessions.html";
        };
        el("monitor-btn").onclick = () => {
            window.open(`attendance.html?session=${sessionId}`, "_blank");
        };
    }

    /* ================= 4. STUDENT SCANNER (Updated GPS & Debug) ================= */
    if (el("reader")) {
        const user = requireAuth();
        if (user) {
            // Warning for HTTP
            if (!navigator.geolocation && window.location.protocol !== 'https:') {
                alert("⚠️ GPS Warning: Please ensure you have enabled 'Insecure origins' in chrome://flags for this IP.");
            }

            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: 250,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
            });

            scanner.render(onScanSuccess);

            function onScanSuccess(decodedText) {
                scanner.clear();
                el("reader").style.display = "none";
                handleAttendanceProcess(decodedText);
            }

            async function handleAttendanceProcess(qrJsonString) {
                // 1. SILENT CHECK: Is this even a valid QR code?
                // We do this BEFORE updating the UI or asking for GPS.
                let qrData;
                try {
                    qrData = JSON.parse(qrJsonString);
                    // Check if it has the specific keys our system needs
                    if (!qrData.sid || !qrData.tok) throw new Error("This is not a valid Class QR Code.");
                } catch (e) {
                    // If it fails here, we stop immediately.
                    // We don't ask for GPS, and we don't say "Acquiring GPS".
                    el("result-area").classList.remove("hidden");
                    updateStatus("❌", "Invalid QR Format. Please scan the Class QR.", "red");
                    if (el("retry-btn")) el("retry-btn").classList.remove("hidden");
                    return; // STOP EXECUTION HERE
                }

                // 2. If we passed Step 1, NOW we show the UI and ask for GPS
                el("result-area").classList.remove("hidden");
                // Clear previous debug info
                if (el("debug-info")) el("debug-info").innerHTML = "";

                updateStatus("⏳", "QR Validated. Acquiring GPS Location...", "orange");

                try {
                    // 3. Get Student GPS (Now we know the QR is good)
                    const position = await getPositionWithTimeout(10000);
                    const studentLat = position.coords.latitude;
                    const studentLon = position.coords.longitude;

                    updateStatus("📡", "Sending to Server...", "blue");

                    // 4. Send to Backend
                    const payload = {
                        student_id: user.id,
                        session_id: qrData.sid,
                        qr_token: qrData.tok,
                        latitude: studentLat,
                        longitude: studentLon,
                        device_id: getDeviceId()
                    };

                    const res = await fetch(`${CONFIG.API_URL}/attendance`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    // 5. DEBUG INFO (Updates only after server response)
                    if (el("debug-info")) {
                        let debugHtml = `<strong>You:</strong> ${studentLat.toFixed(5)}, ${studentLon.toFixed(5)}<br>`;
                        if (data.distance !== undefined) {
                            debugHtml += `<strong>Distance:</strong> ${data.distance} meters<br>`;
                        }
                        if (data.lecturer_location) {
                            debugHtml += `<strong>Class:</strong> ${data.lecturer_location.lat.toFixed(5)}, ${data.lecturer_location.lon.toFixed(5)}`;
                        }
                        el("debug-info").innerHTML = debugHtml;
                    }

                    if (res.ok) {
                        updateStatus("✅", `Attendance Marked! (${data.distance}m)`, "green");
                        if (el("retry-btn")) el("retry-btn").classList.add("hidden");
                    } else {
                        throw new Error(data.error || "Server rejected attendance");
                    }

                } catch (err) {
                    console.error(err);
                    updateStatus("❌", err.message, "red");
                    if (el("retry-btn")) el("retry-btn").classList.remove("hidden");
                }
            }

            function updateStatus(icon, text, color) {
                el("status-title").innerText = icon + " " + (color === "green" ? "Success" : (color === "red" ? "Failed" : "Processing"));
                el("status-msg").innerText = text;
                el("status-title").style.color = color;
            }

            if (el("retry-btn")) el("retry-btn").onclick = () => window.location.reload();
        }
    }

    /* ================= 5. HISTORY / LISTS ================= */
    if (el("attendance-list")) {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session");

        if (sessionId) {
            setInterval(() => {
                fetch(`${CONFIG.API_URL}/sessions/${sessionId}/attendance`)
                    .then(res => res.json())
                    .then(data => {
                        el("count").innerText = data.length;
                        const list = el("attendance-list");
                        list.innerHTML = "";
                        data.forEach(r => {
                            list.innerHTML += `
                                <tr>
                                    <td>${r.name}</td>
                                    <td>${r.university_id || r.admission_no}</td>
                                    <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
                                </tr>`;
                        });
                    });
            }, 3000);
        }
    }

    /* ================= GLOBAL LISTENERS ================= */
    if (el("logout-btn")) {
        el("logout-btn").addEventListener("click", () => {
            localStorage.removeItem("user");
            window.location.href = "index.html";
        });
    }

});