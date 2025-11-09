# Quick Start Guide

Follow these steps to get the Contextual Bookmarking System up and running.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (free tier works)
- Chrome or Firefox browser

## Step 1: Database Setup (5 minutes)

1. Go to https://supabase.com and create a new project
2. Wait for the project to finish setting up
3. Navigate to the SQL Editor
4. Copy the contents of `database-setup.sql` 
5. Paste and execute it in the SQL editor
6. Go to Settings > API and copy:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_KEY)

## Step 2: Backend Setup (3 minutes)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and add your Supabase credentials:
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
PORT=3000
```

Start the backend:
```bash
npm run dev
```

You should see: "Server running on port 3000"

## Step 3: Web Application Setup (3 minutes)

Open a new terminal:

```bash
cd web
npm install
cp .env.example .env
```

Edit `web/.env`:
```
VITE_API_URL=http://localhost:3000/api
VITE_USER_ID=test-user-123
```

Start the web app:
```bash
npm run dev
```

Open http://localhost:5173 in your browser

## Step 4: Browser Extension Setup (5 minutes)

Open a new terminal:

```bash
cd extension
npm install
npm run build
```

### Load in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. Done! The extension icon should appear

### Load in Firefox:
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `extension/dist/manifest.json`

## Step 5: Test It Out!

1. Click the extension icon on any webpage
2. Add a title, summary, and category
3. Click "Save Bookmark"
4. Go to the web app (http://localhost:5173)
5. Your bookmark should appear!

## Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify your `.env` file has correct Supabase credentials
- Run `npm install` again

### Web app shows errors
- Make sure backend is running on port 3000
- Check browser console for errors
- Verify `.env` file is correct

### Extension won't load
- Make sure you built it with `npm run build`
- Check that all dependencies installed correctly
- Look for errors in `chrome://extensions/` (with Developer mode on)

### Bookmarks not saving
- Check browser console for errors
- Verify backend is running
- Make sure extension has correct API_URL in `extension/src/config.ts`
- For production, update the URL to your deployed backend

## Next Steps

Once everything works locally:

1. Deploy backend to Vercel
2. Deploy web app to Vercel
3. Update extension config with production API URL
4. Rebuild and reload extension
5. Start bookmarking!

## Need Help?

Check the main README.md for detailed documentation and API endpoints.
