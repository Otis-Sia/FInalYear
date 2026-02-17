const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuration
const NUM_STUDENTS = 700;
const NUM_SESSIONS = 14;
const PASSWORD = '1234';
const OUTPUT_FILE = path.join(__dirname, 'sample_seed.sql');

function pad(n, width=4) {
  return String(n).padStart(width, '0');
}

function nowSQL() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function generateUsers() {
  const users = [];
  const hash = bcrypt.hashSync(PASSWORD, 10);
  // Keep some determinism in emails and ids
  for (let i = 1; i <= NUM_STUDENTS; i++) {
    const user_id = `S-${pad(i,4)}`;
    const full_name = `Student ${pad(i,4)}`;
    const university_id = `UNI${pad(i,6)}`;
    const email = `student${i}@example.com`;
    users.push({ user_id, full_name, university_id, email, password: hash, role: 'student' });
  }
  return users;
}

function generateSessions() {
  const sessions = [];
  const lecturers = [1,5,6];
  for (let i = 1; i <= NUM_SESSIONS; i++) {
    const id = 1000 + i;
    const unit_code = `UNIT-${pad(i,2)}`;
    const lecturer_id = lecturers[(i-1) % lecturers.length];
    const qr_token = `token-${id}-${Math.random().toString(36).slice(2,10)}`;
    const created_at = nowSQL();
    sessions.push({ id, unit_code, lecturer_id, qr_token, is_active:1, created_at, latitude: null, longitude: null, require_gps:1 });
  }
  return sessions;
}

function pickStatusForStudent(studentIndex, sessionIndex) {
  // Create multiple scenarios by patterning some student groups differently.
  // - First 50 students: always present
  // - Next 50 students: alternate present/absent per session
  // - Next 100 students: mostly present with occasional late
  // - Next 100 students: mostly absent
  // - Remaining students: random with weighted probs
  if (studentIndex <= 50) return 'Present';
  if (studentIndex <= 100) return (sessionIndex % 2 === 0) ? 'Present' : 'Absent';
  if (studentIndex <= 200) {
    const r = Math.random();
    if (r < 0.80) return 'Present';
    if (r < 0.90) return 'Late';
    return 'Absent';
  }
  if (studentIndex <= 300) {
    const r = Math.random();
    if (r < 0.20) return 'Present';
    if (r < 0.25) return 'Late';
    return 'Absent';
  }
  // remaining 400 students
  const r = Math.random();
  if (r < 0.7) return 'Present';
  if (r < 0.8) return 'Late';
  return 'Absent';
}

function generateAttendance(users, sessions) {
  const rows = [];
  for (let sIdx = 0; sIdx < users.length; sIdx++) {
    const student = users[sIdx];
    // We'll reference students using a subquery by user_id to resolve id at insert-time
    for (let sessIdx = 0; sessIdx < sessions.length; sessIdx++) {
      const session = sessions[sessIdx];
      const status = pickStatusForStudent(sIdx+1, sessIdx+1);
      const timestamp = nowSQL();
      const sql = `( ${session.id}, (SELECT id FROM users WHERE user_id = '${users[sIdx].user_id}'), '${timestamp}', '${status}', NULL)`;
      rows.push(sql);
    }
  }
  return rows;
}

function buildSQL() {
  const users = generateUsers();
  const sessions = generateSessions();

  const parts = [];
  parts.push('-- Generated sample seed');
  parts.push('START TRANSACTION;');

  // Users
  parts.push('\n-- Users');
  for (let i = 0; i < users.length; i += 100) {
    const chunk = users.slice(i, i+100);
    const values = chunk.map(u => `('${u.user_id}','${u.full_name.replace("'","\\'")}', '${u.university_id}', '${u.email}', '${u.password}', 'student', '${nowSQL()}')`).join(',');
    parts.push(`INSERT INTO users (user_id, full_name, university_id, email, password, role, created_at) VALUES ${values};`);
  }

  // Sessions
  parts.push('\n-- Sessions');
  for (const s of sessions) {
    const values = `(${s.id},'${s.unit_code}','${s.lecturer_id}','${s.qr_token}',${s.is_active},'${s.created_at}',${s.latitude === null ? 'NULL' : s.latitude},${s.longitude === null ? 'NULL' : s.longitude},${s.require_gps})`;
    parts.push(`INSERT INTO sessions (id, unit_code, lecturer_id, qr_token, is_active, created_at, latitude, longitude, require_gps) VALUES ${values};`);
  }

  // Attendance using subselect to resolve student id by user_id
  parts.push('\n-- Attendance');
  const attendanceRows = generateAttendance(users, sessions);
  // Insert in batches to avoid huge single statement
  for (let i = 0; i < attendanceRows.length; i += 500) {
    const chunk = attendanceRows.slice(i, i+500);
    const stmt = `INSERT INTO attendance (session_id, student_id, timestamp, status, device_id) VALUES ${chunk.join(',')};`;
    parts.push(stmt);
  }

  parts.push('COMMIT;');
  return parts.join('\n');
}

function main() {
  const sql = buildSQL();
  fs.writeFileSync(OUTPUT_FILE, sql);
  console.log('Wrote', OUTPUT_FILE);
}

if (require.main === module) main();

module.exports = { generateUsers, generateSessions, generateAttendance };
