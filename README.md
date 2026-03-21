# 🌟 Lumina — Instagram Clone

A full-featured social network built with **Next.js 14**, **Supabase**, **Tailwind CSS**, and **Framer Motion**. Dark theme with neon gradients and glassmorphism UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Auth | Email/password via Supabase Auth |
| 👤 Profiles | Avatar, bio, website, followers/following |
| 📸 Posts | Create, view, delete with image upload |
| ❤️ Likes | Double-tap to like, real-time count |
| 💬 Comments | Threaded comments on posts |
| 📖 Stories | 24-hour stories with viewer tracking |
| 💌 Messages | Real-time chat via Supabase Realtime |
| 🔍 Search | Search users and posts |
| 🧭 Explore | Discover top posts |
| 🔔 Notifications | Like, comment, follow alerts |
| 🌙 Dark Theme | Neon gradients + glassmorphism |

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Animations**: Framer Motion
- **Deployment**: Vercel

---

## 📋 Prerequisites

Before you start, make sure you have:
- [Node.js](https://nodejs.org/) version **18.17** or higher
- [Git](https://git-scm.com/) installed
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account
- A free [GitHub](https://github.com) account

---

## 🚀 PART 1 — Set Up Supabase

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `lumina` (or any name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to be ready

### Step 2: Get Your API Keys

1. In your Supabase project, click **"Settings"** (gear icon in the sidebar)
2. Click **"API"**
3. Copy these two values (you'll need them later):
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

### Step 3: Run the Database Schema

1. In your Supabase project, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Copy the **entire contents** of `supabase/schema.sql` from this project
4. Paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
6. You should see "Success. No rows returned" — this is correct!

> ⚠️ If you see errors about storage buckets already existing, that's fine — just ignore those lines.

### Step 4: Enable Realtime (for Messages)

1. In Supabase, go to **"Database"** → **"Replication"**
2. Find the `messages` table and toggle it **ON**
3. Find the `notifications` table and toggle it **ON**

### Step 5: Configure Authentication

1. Go to **"Authentication"** → **"URL Configuration"**
2. Set **Site URL** to:
   - For local dev: `http://localhost:3000`
   - After Vercel deploy: your Vercel URL (e.g. `https://lumina-abc123.vercel.app`)
3. Add to **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-vercel-domain.vercel.app/**`

---

## 💻 PART 2 — Run Locally

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/lumina.git
cd lumina
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

Create a file called `.env.local` in the root of the project:

```bash
# Copy the example file
cp .env.example .env.local
```

Then open `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the Lumina login page! 🎉

### Step 5: Create Your First Account

1. Click **"Sign up"**
2. Enter your details and create an account
3. You'll be redirected to the feed

---

## 📦 PART 3 — Push to GitHub

### Step 1: Create a GitHub Repository

1. Go to [https://github.com](https://github.com) and sign in
2. Click the **"+"** button → **"New repository"**
3. Fill in:
   - **Repository name**: `lumina` (or any name)
   - **Visibility**: Public or Private
   - ❌ Do NOT check "Initialize this repository with a README"
4. Click **"Create repository"**

### Step 2: Push Your Code

In your terminal (inside the project folder):

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Lumina social network"

# Add your GitHub repo as remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/lumina.git

# Push to GitHub
git push -u origin main
```

> If you see an error about branch name, try: `git push -u origin master`

---

## ☁️ PART 4 — Deploy to Vercel (Step by Step)

### Step 1: Sign In to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub

### Step 2: Import Your Project

1. On the Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your `lumina` repository in the list
3. Click **"Import"**

### Step 3: Configure the Project

On the configuration screen:

- **Framework Preset**: Should auto-detect **Next.js** ✅
- **Root Directory**: Leave as `.` (default) ✅
- **Build Command**: Leave as default (`npm run build`) ✅
- **Output Directory**: Leave as default ✅

### Step 4: Add Environment Variables

This is the most important step! Click **"Environment Variables"** and add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

To add each one:
1. Type the **Name** in the "Key" field
2. Paste the **Value** in the "Value" field
3. Click **"Add"**
4. Repeat for the second variable

### Step 5: Deploy!

1. Click the big **"Deploy"** button
2. Wait 2-3 minutes for the build to complete
3. You'll see a green "Congratulations!" screen
4. Click **"Visit"** to see your live site! 🚀

### Step 6: Update Supabase Auth URLs

After deployment, copy your Vercel URL (e.g. `https://lumina-abc123.vercel.app`) and:

1. Go back to your Supabase project
2. **"Authentication"** → **"URL Configuration"**
3. Update **Site URL** to your Vercel URL
4. Add your Vercel URL + `/**` to **Redirect URLs**
5. Click **"Save"**

---

## 🔄 Updating Your Deployment

Every time you push to GitHub, Vercel automatically redeploys:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically build and deploy within 2-3 minutes.

---

## 📁 Project Structure

```
lumina/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── register/page.tsx       # Register page
│   ├── (main)/
│   │   ├── feed/page.tsx           # Main feed
│   │   ├── explore/page.tsx        # Explore page
│   │   ├── search/page.tsx         # Search page
│   │   ├── messages/page.tsx       # Messages/chat
│   │   ├── notifications/page.tsx  # Notifications
│   │   ├── stories/
│   │   │   ├── page.tsx            # Stories list
│   │   │   └── [id]/page.tsx       # Story viewer
│   │   └── profile/
│   │       ├── [username]/page.tsx # User profile
│   │       └── edit/page.tsx       # Edit profile
│   ├── api/
│   │   ├── auth/callback/route.ts  # Auth callback
│   │   ├── posts/route.ts          # Posts API
│   │   ├── followers/route.ts      # Follow API
│   │   ├── search/route.ts         # Search API
│   │   ├── stories/route.ts        # Stories API
│   │   └── messages/route.ts       # Messages API
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── not-found.tsx               # 404 page
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Desktop sidebar
│   │   └── MobileNav.tsx           # Mobile bottom nav
│   ├── posts/
│   │   ├── PostCard.tsx            # Individual post
│   │   ├── PostFeed.tsx            # Feed of posts
│   │   ├── CreatePostModal.tsx     # Create post modal
│   │   └── CommentsModal.tsx       # Comments modal
│   ├── stories/
│   │   ├── StoriesBar.tsx          # Stories bar
│   │   └── CreateStoryButton.tsx   # Create story
│   ├── messages/
│   │   └── MessagesClient.tsx      # Chat UI
│   ├── profile/
│   │   ├── ProfileHeader.tsx       # Profile header
│   │   ├── ProfileGrid.tsx         # Posts grid
│   │   └── SuggestedUsers.tsx      # Suggestions
│   └── ui/
│       └── UserAvatar.tsx          # Avatar component
├── hooks/
│   ├── useDebounce.ts              # Debounce hook
│   └── useUser.ts                  # Auth user hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts           # Auth middleware
│   └── utils.ts                    # Utility functions
├── types/
│   └── index.ts                    # TypeScript types
├── supabase/
│   └── schema.sql                  # Complete DB schema
├── .env.example                    # Example env file
├── middleware.ts                   # Next.js middleware
├── next.config.js                  # Next.js config
├── tailwind.config.ts              # Tailwind config
└── vercel.json                     # Vercel cron config
```

---

## 🔧 Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### Build fails on Vercel
- Double-check your environment variables are set correctly in Vercel
- Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are added

### Auth redirect not working
- Make sure your Vercel URL is added to Supabase Auth → URL Configuration → Redirect URLs

### Images not loading
- Verify your Supabase storage buckets (`posts`, `avatars`, `stories`) are set to **public**
- Check that the storage policies from `schema.sql` were applied

### Database errors
- Re-run the entire `supabase/schema.sql` in the SQL Editor
- Make sure you're using the correct Supabase project

---

## 🌐 Environment Variables Reference

| Variable | Where to find it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | ✅ Yes |

---

## 📜 License

MIT — free to use and modify.

---

Made with ❤️ using Next.js 14 + Supabase update.
d e p l o y 
 
 d e p l o y 
 
 d e p l o y 
 
 