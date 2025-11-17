# Installation Guide

Complete guide to installing and setting up Ghost Clone on your system.

## System Requirements

### Minimum Requirements
- **OS**: Linux, macOS, or Windows
- **RAM**: 512MB
- **Disk**: 100MB free space
- **Elide**: Version 1.0.0 or higher

### Recommended
- **RAM**: 2GB
- **Disk**: 1GB free space (for media uploads)
- **CPU**: 2+ cores

### Optional Components
- **Node.js**: 18+ (for admin dashboard development)
- **Python**: 3.8+ with Pillow (for image processing)
- **Nginx**: For reverse proxy in production

## Installing Elide

### Linux / macOS

```bash
# Download and install Elide
curl -fsSL https://elide.dev/install.sh | bash

# Verify installation
elide --version
```

### Windows

```powershell
# Download installer from https://elide.dev/download
# Or use package manager
scoop install elide
```

### From Source

```bash
git clone https://github.com/elide-dev/elide.git
cd elide
./gradlew build
```

## Installing Ghost Clone

### Method 1: From Release

```bash
# Download latest release
wget https://github.com/elide/ghost-clone/releases/latest/ghost-clone.tar.gz

# Extract
tar -xzf ghost-clone.tar.gz
cd ghost-clone

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start server
npm start
```

### Method 2: From Source

```bash
# Clone repository
git clone https://github.com/elide/ghost-clone.git
cd ghost-clone

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start server
npm start
```

## Installing Python Image Processing (Optional)

For advanced image processing features:

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
pip3 install Pillow
```

### macOS
```bash
brew install python
pip3 install Pillow
```

### Windows
```bash
# Install Python from python.org
pip install Pillow
```

## Building Admin Dashboard

The admin dashboard is a React application that needs to be built:

```bash
cd admin
npm install
npm run build
cd ..
```

For development:
```bash
cd admin
npm run dev
```

## Database Setup

### Automatic (Recommended)

```bash
npm run migrate
```

This will:
1. Create the SQLite database
2. Run all migrations
3. Seed initial data
4. Create default admin user

### Manual

```bash
# Initialize database
elide run cli/migrate.js

# Verify
sqlite3 data/ghost.db "SELECT * FROM users;"
```

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# Server
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Security
JWT_SECRET=your-super-secret-key-change-this

# Database
DATABASE_PATH=./data/ghost.db

# Media
UPLOAD_PATH=./content/images
MAX_FILE_SIZE=10485760

# CDN (optional)
CDN_URL=https://cdn.example.com

# Email (optional)
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### Configuration Files

Create environment-specific configs:

**config/development.json**
```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "cache": {
    "enabled": false
  },
  "dev": true
}
```

**config/production.json**
```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "cache": {
    "enabled": true,
    "ttl": 300
  },
  "cdn": {
    "enabled": true,
    "url": "https://cdn.example.com"
  }
}
```

## First Run

1. **Start the server**
   ```bash
   npm start
   ```

2. **Access the site**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/admin

3. **Login with default credentials**
   - Email: admin@example.com
   - Password: Admin123456

4. **Change admin password immediately**
   - Go to Settings → Users
   - Edit admin user
   - Set a strong password

## Verification

Test that everything is working:

```bash
# Test API
curl http://localhost:3000/api/v1/posts

# Test RSS
curl http://localhost:3000/rss

# Test sitemap
curl http://localhost:3000/sitemap.xml

# Test admin login
curl -X POST http://localhost:3000/api/admin/session \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123456"}'
```

## Troubleshooting

### Database Errors

**Error: database is locked**
```bash
# Close the database connection
pkill -f "ghost"

# Restart
npm start
```

**Error: no such table**
```bash
# Re-run migrations
npm run migrate
```

### Permission Errors

**Error: EACCES permission denied**
```bash
# Fix permissions
chmod -R 755 .
chmod 644 data/ghost.db
```

### Port Already in Use

**Error: EADDRINUSE**
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Image Upload Errors

**Error: Python not found**
```bash
# Install Python and Pillow
pip3 install Pillow

# Or disable image processing
# In config: imageProcessing.enabled = false
```

### Admin Dashboard Not Loading

**Error: 404 on /admin**
```bash
# Build admin dashboard
cd admin
npm install
npm run build
cd ..

# Restart server
npm start
```

## Next Steps

- [Configure your site](configuration.md)
- [Create your first post](getting-started.md)
- [Customize your theme](themes.md)
- [Deploy to production](deployment.md)

## Getting Help

- Check [FAQ](faq.md)
- Read [Troubleshooting Guide](troubleshooting.md)
- Ask in [Community Forum](https://elide.dev/community)
- Report bugs on [GitHub](https://github.com/elide/ghost-clone/issues)
