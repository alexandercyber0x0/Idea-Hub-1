# 💡 Idea Hub

A secure, encrypted personal idea management system with voice recording, AI summarization, and AI tools tracking.

## ✨ Features

- **📝 Idea Management** - Kanban board with drag-and-drop
- **🎙️ Voice Recording** - Record ideas, auto-transcribe, AI summarize
- **🔐 AES-256 Encryption** - All sensitive data is encrypted
- **🤖 AI Tools Tracker** - Save AI tools with auto-discovered info
- **📱 Instagram Reels** - Link reels to ideas and tools
- **💾 Export/Import** - Encrypted backups for data portability

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Start development server
bun run dev
```

## 📦 Deployment (Railway)

### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/idea-hub)

### Option 2: Manual Deploy

1. **Create a GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/idea-hub.git
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the Dockerfile

3. **Set Environment Variables** (if needed)
   - Go to your project → Variables
   - Add any required environment variables

4. **Done!** Railway will:
   - Build your Docker image
   - Create persistent volumes for data
   - Run database migrations
   - Start your app

## 🔧 Environment Variables

Create a `.env` file (optional):

```env
DATABASE_URL="file:./db/custom.db"
NODE_ENV="production"
```

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Password management
│   │   ├── ideas/     # Ideas CRUD
│   │   ├── ai-tools/  # AI tools CRUD
│   │   ├── transcribe/# Voice transcription
│   │   ├── summarize/ # AI summarization
│   │   ├── export/    # Data export
│   │   └── import/    # Data import
│   └── page.tsx       # Main application
├── components/        # React components
└── lib/               # Utilities
    ├── encryption.ts  # AES-256 encryption
    └── passwordManager.ts
```

## 🔐 Security

- **AES-256-GCM** encryption for sensitive fields
- **PBKDF2** key derivation (100,000 iterations)
- Password required on each session
- Data stored locally (never sent to third parties)

## 📱 Data Portability

1. **Export**: Settings → Backup → Export Backup
2. **Import**: Settings → Backup → Import Backup
3. Transfer JSON file between devices

## 🛠️ Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Prisma** ORM
- **SQLite** database
- **Tailwind CSS** + shadcn/ui
- **Framer Motion** animations
- **z-ai-web-dev-sdk** for AI features

## 📄 License

MIT
