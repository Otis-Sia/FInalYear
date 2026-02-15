require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const readline = require('readline');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

db.connect(async (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('Connected to database.');

    try {
        console.log("\n--- Create New Admin User ---\n");

        const name = await ask("Enter Full Name: ");
        const userId = await ask("Enter User ID (e.g., ADM-002): ");
        const email = await ask("Enter Email (optional): ");
        const password = await ask("Enter Password: ");

        if (!name || !userId || !password) {
            console.error("❌ Error: Name, User ID, and Password are required.");
            process.exit(1);
        }

        const hash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (full_name, user_id, email, password, role) 
            VALUES (?, ?, ?, ?, 'admin')
        `;

        db.query(sql, [name, userId, email || null, hash], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.error("❌ Error: User ID or Email already exists.");
                } else {
                    console.error("❌ Database Error:", err.message);
                }
            } else {
                console.log(`\n✅ Admin user '${name}' created successfully!`);
                console.log(`👉 Login with User ID: ${userId}`);
            }
            db.end();
            rl.close();
        });

    } catch (e) {
        console.error("Error:", e);
        db.end();
        rl.close();
    }
});
