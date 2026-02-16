# Deployment Guide

This guide covers how to deploy the Attendance Management System on a Linux server (e.g., Ubuntu) or check it locally.

## Prerequisites

- **Node.js**: v16 or higher.
- **MySQL**: 8.0 or higher.
- **Git**: To clone the repository.
- **Nginx** (Optional but recommended): For reverse proxy and SSL.

## 1. System Setup

### Install Dependencies (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nodejs npm mysql-server git nginx
```

### Clone Repository

```bash
git clone https://github.com/your-repo/attendance-management.git
cd attendance-management
```

## 2. Database Configuration

1. **Log into MySQL**:
   ```bash
   sudo mysql -u root -p
   ```

2. **Create Database & User**:
   ```sql
   CREATE DATABASE attendance_system;
   CREATE USER 'sia'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON attendance_system.* TO 'sia'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Import Schema**:
   ```bash
   mysql -u sia -p attendance_system < merged_database.sql
   ```

## 3. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
nano .env
```

**Required Variables**:

```env
PORT=3000
DB_HOST=localhost
DB_USER=sia
DB_PASSWORD=your_password
DB_NAME=attendance_system
```

## 4. Install & Run

Using the provided script:

```bash
./start_system.sh
```

Or manually:

```bash
npm install
node backend/server.js
```

## 5. Nginx Configuration (Production)

Create a configuration file: `/etc/nginx/sites-available/attendance`

```nginx
server {
    listen 80;
    server_name attendance.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Security Considerations

- **SSL/TLS**: Use Certbot to enable HTTPS (`sudo certbot --nginx`).
- **Firewall**: Ensure port 80/443 are open (`sudo ufw allow 'Nginx Full'`).
- **Database**: Ensure MySQL isn't exposed to the public internet (bind-address 127.0.0.1).
