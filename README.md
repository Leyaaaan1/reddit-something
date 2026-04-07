# Reddit Analytics Platform

A hobby application that scrapes Reddit posts, analyzes them using AI, and stores results in your browser's local storage for instant access.

## 🎯 What is This App?

This app lets you:
- **Scrape Reddit** - Fetch trending posts from multiple subreddits
- **Analyze with AI** - Use Google Gemini to extract sentiment, summary, and keywords
- **View Results** - See all analyzed posts in a clean, filterable interface
- **Stay Private** - All data is stored locally in your browser (no server storage)

Each user gets their own isolated data. Your posts won't interfere with other users' data.

## 📦 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Storage**: Browser LocalStorage (per-user data)
- **AI Analysis**: Google Gemini AI (Free Tier)
- **Data Source**: Reddit Public JSON API
- **Hosting**: Vercel

## 🔄 Workflow Explanation

### End-to-End Flow

**1. Scraping Reddit Posts**
- User enters subreddit names and number of posts
- App fetches from Reddit's public API (no auth required)
- Posts are scraped and returned by backend

**2. Storing in Local Memory**
- Posts are saved to **browser's localStorage**
- Each user has their own isolated storage
- Data persists even after page refresh
- Clearing data only affects current user

**3. AI Analysis**
- Gemini API analyzes post title + content
- Extracts: sentiment (positive/neutral/negative), summary, keywords
- Results are stored alongside each post
- Rate limited to 30 requests/minute (free tier)

**4. Displaying Results**
- Posts are fetched from localStorage
- Filtered by sentiment or shown all
- Real-time updates every 3 seconds
- Shows metadata: subreddit, author, score, analysis results

**5. Data Management**
- **Clear All** - Removes all posts from your browser storage
- **Multiple Users** - Each browser/incognito session has separate data
- **No Server Conflicts** - Your data never interferes with other users

## 🛠️ Setup Instructions

```bash
# 1. Clone repository
git clone [your-repo]
cd [project-name]

# 2. Install dependencies
npm install

# 3. Create .env file with:
DATABASE_URL=your_neon_database_url
ADMIN_API_KEY=your_secret_admin_key
NEXT_PUBLIC_ADMIN_KEY=your_secret_admin_key
gemini_api_key=your_gemini_api_key
REDDIT_USER_AGENT="windows:my-reddit-scraper:1.0"

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000


