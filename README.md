# Contextual Bookmarking System - MVP

A lightweight bookmarking system that allows users to save, organize, and search web pages with context. Built with Express.js, React, and Supabase.

## Features

- **Browser Extension**: One-click bookmark saving from any webpage
- **Web Application**: Browse, search, and organize your bookmarks
- **Categories**: Organize bookmarks by categories
- **Full-Text Search**: Search across titles, summaries, and URLs
- **Infinite Scroll**: Seamlessly load more bookmarks as you scroll
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
.
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── middleware/  # Auth, error handling
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API endpoints
│   │   ├── types/       # TypeScript types
│   │   └── index.ts     # Main application
│   └── package.json
│
├── web/                 # React web application
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom hooks
│   │   ├── pages/      # Page components
│   │   ├── App.tsx     # Main app component
│   │   └── main.tsx    # Entry point
│   └── package.json
│
├── extension/           # Browser extension
│   ├── src/
│   │   ├── popup.ts    # Popup logic
│   │   ├── popup.html  # Popup UI
│   │   ├── popup.css   # Popup styles
│   │   └── config.ts   # Configuration
│   ├── manifest.json   # Extension manifest
│   └── package.json
│
└── database-setup.sql   # Database schema
```

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL editor
3. Execute the SQL from `database-setup.sql`
4. Get your Supabase URL and anon key from Settings > API

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key
# PORT=3000

# Run in development mode
npm run dev

# Or build and run in production
npm run build
npm start
```

The backend will run on `http://localhost:3000`

### 3. Web Application Setup

```bash
cd web

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add:
# VITE_API_URL=http://localhost:3000/api
# VITE_USER_ID=test-user-123

# Run in development mode
npm run dev

# Or build for production
npm run build
```

The web app will run on `http://localhost:5173`

### 4. Browser Extension Setup

```bash
cd extension

# Install dependencies
npm install

# Build the extension
npm run build

# The built extension will be in the 'dist' folder
```

#### Loading the Extension in Chrome:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. The extension icon should appear in your toolbar

#### Loading in Firefox:

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from `extension/dist` folder

## Usage

### Saving a Bookmark

1. Click the extension icon while on any webpage
2. The title will be auto-filled from the page
3. Add an optional summary and category
4. Click "Save Bookmark"

### Viewing Bookmarks

1. Open the web application
2. Browse all bookmarks on the home page
3. Filter by category using the sidebar
4. Use infinite scroll to load more bookmarks

### Searching Bookmarks

1. Navigate to the Search page
2. Enter your search query
3. Results will include matches in title, summary, and URL

## API Endpoints

### Bookmarks

- `POST /api/bookmarks` - Create a new bookmark
- `GET /api/bookmarks` - Get all bookmarks (with filters)
  - Query params: `search`, `category`, `startDate`, `endDate`, `limit`, `offset`

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category

## Authentication

For MVP purposes, authentication is simplified using a header-based user ID:
- Header: `x-user-id: test-user-123`

**Note**: In production, implement proper authentication using Supabase Auth or similar.

## Deployment

### Backend to Vercel

```bash
cd backend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - SUPABASE_URL
# - SUPABASE_KEY
```

### Web App to Vercel

```bash
cd web

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - VITE_API_URL (your backend URL)
# - VITE_USER_ID
```

### Extension Distribution

For Chrome Web Store:
1. Zip the `extension/dist` folder
2. Create a developer account
3. Upload the zip file
4. Submit for review

For Firefox Add-ons:
1. Zip the contents of `extension/dist` folder
2. Submit to addons.mozilla.org

## Development

### Running All Services Locally

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Web App
cd web && npm run dev

# Terminal 3 - Extension (watch mode)
cd extension && npm run dev
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database tables are created
- [ ] Can create a bookmark via API
- [ ] Can retrieve bookmarks via API
- [ ] Can filter bookmarks by category
- [ ] Search returns relevant results
- [ ] Web app loads and displays bookmarks
- [ ] Infinite scroll loads more bookmarks
- [ ] Category filter works
- [ ] Search page works
- [ ] Extension loads in browser
- [ ] Extension can save bookmarks
- [ ] Bookmarks appear in web app after saving

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, TypeScript, Vite
- **Database**: Supabase (PostgreSQL)
- **Extension**: Chrome Extension API, TypeScript, Webpack
- **Deployment**: Vercel

## Future Enhancements (Post-MVP)

- User authentication with Supabase Auth
- Tags system
- Bookmark collections
- Import/export functionality
- Sharing bookmarks
- Browser history integration
- AI-powered summaries
- Dark mode
- Mobile app

## License

MIT

## Contributing

This is an MVP project. For contributions, please open an issue first to discuss proposed changes.
