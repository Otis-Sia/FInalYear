require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(async (err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');

    // 1. Modify users table to add 'admin' enum
    const alterQuery = "ALTER TABLE users MODIFY COLUMN role ENUM('student', 'lecturer', 'admin') NOT NULL";

    db.query(alterQuery, (err, result) => {
        if (err) {
            console.error('Error altering table:', err);
        } else {
            console.log("✅ 'role' column updated to include 'admin'.");
        }

        // 2. Insert default admin user
        const adminUser = {
            name: 'System Admin',
            user_id: 'ADMIN-001',
            email: 'admin@university.ac.ke',
            password: 'adminpassword123', // Change this!
            role: 'admin'
        };

        bcrypt.hash(adminUser.password, 10, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                db.end();
                return;
            }

            const insertQuery = `
                INSERT IGNORE INTO users (full_name, user_id, email, password, role) 
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(insertQuery, [adminUser.name, adminUser.user_id, adminUser.email, hash, adminUser.role], (err, result) => {
                if (err) {
                    console.error('Error creating admin user:', err);
                } else {
                    if (result.affectedRows > 0) {
                        console.log(`✅ Default admin created: User ID: ${adminUser.user_id}, Password: ${adminUser.password}`);
                    } else {
                        console.log(`ℹ️ Admin user ${adminUser.user_id} already exists.`);
                    }
                }
                db.end();
            });
        });
    });
});
