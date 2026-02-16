document.addEventListener("DOMContentLoaded", () => {
    // 1. Auth Check (Client-Side)
    const user = getUser();
    if (!user || user.role !== 'admin') {
        alert("Access Denied");
        window.location.href = "index.html";
        return;
    }

    el("welcome-msg").innerText = `Welcome, ${user.name} (Admin)`;

    // 2. Tabs Logic
    const tabUsers = el("tab-users");
    const tabUnits = el("tab-units");
    const sectionUsers = el("section-users");
    const sectionUnits = el("section-units");

    function switchTab(tab) {
        if (tab === 'users') {
            tabUsers.classList.add("active");
            tabUnits.classList.remove("active");
            sectionUsers.classList.add("active");
            sectionUnits.classList.remove("active");
            loadUsers();
        } else {
            tabUsers.classList.remove("active");
            tabUnits.classList.add("active");
            sectionUsers.classList.remove("active");
            sectionUnits.classList.add("active");
            loadUnits();
            loadLecturers(); // for dropdown
        }
    }

    tabUsers.onclick = () => switchTab('users');
    tabUnits.onclick = () => switchTab('units');

    // 3. Data Loading
    const adminHeaders = { "x-admin-id": String(user.id) }; // Pass admin ID for middleware

    async function loadUsers() {
        const tbody = document.querySelector("#users-table tbody");
        tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

        try {
            const users = await apiFetch(`/admin/users?admin_id=${user.id}`, { headers: adminHeaders });
            tbody.innerHTML = "";
            users.forEach(u => {
                const tr = document.createElement("tr");
                const lastSeen = u.last_seen ? new Date(u.last_seen).toLocaleString() : "Never";
                tr.innerHTML = `
                    <td>${u.full_name}</td>
                    <td>${u.user_id}</td>
                    <td>${u.email || "-"}</td>
                    <td><span class="badge-${u.role}">${u.role}</span></td>
                    <td><small>${lastSeen}</small></td>
                    <td>
                        <button class="btn-danger btn-sm delete-user-btn" data-id="${u.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Attach delete handlers
            document.querySelectorAll(".delete-user-btn").forEach(btn => {
                btn.onclick = () => deleteUser(btn.dataset.id);
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan='5' style='color:red;'>Error: ${err.message}</td></tr>`;
        }
    }

    async function loadUnits() {
        const tbody = document.querySelector("#units-table tbody");
        tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

        try {
            const units = await apiFetch(`/admin/units?admin_id=${user.id}`, { headers: adminHeaders });
            tbody.innerHTML = "";
            units.forEach(u => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${u.unit_code}</td>
                    <td>${u.unit_name}</td>
                    <td>${u.lecturer_name || "<i style='color:#999'>Unassigned</i>"}</td>
                    <td>
                         <button class="btn-danger btn-sm delete-unit-btn" data-id="${u.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll(".delete-unit-btn").forEach(btn => {
                btn.onclick = () => deleteUnit(btn.dataset.id);
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan='4' style='color:red;'>Error: ${err.message}</td></tr>`;
        }
    }

    async function loadLecturers() {
        const select = el("new-unit-lecturer");
        // Keep first option
        const first = select.firstElementChild;
        select.innerHTML = "";
        select.appendChild(first);

        try {
            const lecturers = await apiFetch(`/admin/lecturers?admin_id=${user.id}`, { headers: adminHeaders });
            lecturers.forEach(l => {
                const opt = document.createElement("option");
                opt.value = l.id;
                opt.innerText = `${l.full_name} (${l.user_id})`;
                select.appendChild(opt);
            });
        } catch (err) {
            console.error("Failed to load lecturers", err);
        }
    }

    // 4. Actions
    async function deleteUser(id) {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await apiFetch(`/admin/users/${id}`, {
                method: "DELETE",
                headers: adminHeaders,
                body: JSON.stringify({ admin_id: user.id }) // Body too just in case
            });
            loadUsers();
        } catch (err) {
            alert(err.message);
        }
    }

    async function deleteUnit(id) {
        if (!confirm("Delete this unit?")) return;
        try {
            await apiFetch(`/admin/units/${id}`, {
                method: "DELETE",
                headers: adminHeaders,
                body: JSON.stringify({ admin_id: user.id })
            });
            loadUnits();
        } catch (err) {
            alert(err.message);
        }
    }

    // 5. Forms
    el("add-user-form").onsubmit = async (e) => {
        e.preventDefault();
        const body = {
            name: el("new-user-name").value,
            university_id: el("new-user-id").value,
            email: el("new-user-email").value,
            password: el("new-user-pass").value,
            role: el("new-user-role").value,
            admin_id: user.id
        };

        try {
            await apiFetch("/admin/users", {
                method: "POST",
                headers: adminHeaders,
                body: JSON.stringify(body)
            });
            alert("User created!");
            el("add-user-form").reset();
            loadUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    el("add-unit-form").onsubmit = async (e) => {
        e.preventDefault();
        const body = {
            unit_code: el("new-unit-code").value,
            unit_name: el("new-unit-name").value,
            lecturer_id: el("new-unit-lecturer").value,
            admin_id: user.id
        };

        try {
            await apiFetch("/admin/units", {
                method: "POST",
                headers: adminHeaders,
                body: JSON.stringify(body)
            });
            alert("Unit created!");
            el("add-unit-form").reset();
            loadUnits();
        } catch (err) {
            alert(err.message);
        }
    };

    // Initialize
    loadUsers();
});
