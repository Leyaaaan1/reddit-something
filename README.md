# Reddit Analytics Platform

A free tool that scrapes Reddit posts and uses AI to tell you what people are actually saying — sentiment, summaries, and key topics — with everything kept private in your own browser.

> ⚠️ **Important note:** This project fetches data through Reddit's *unofficial*, undocumented `.json` endpoints (not Reddit's official API). Reddit deprecated unauthenticated access to these endpoints in May 2026, so this method may be unreliable, rate-limited, or blocked entirely depending on when you run it. It is not endorsed by or affiliated with Reddit, and using it may go against Reddit's Terms of Service. Treat this as a personal/educational project rather than a production-ready tool. For a compliant, long-term solution, use [Reddit's official API](https://www.reddit.com/dev/api/) with OAuth.

## What Does This App Do?

In plain terms:

- **Scrape Reddit** — Pull recent posts from any public subreddit(s).
- **Analyze with AI** — Google Gemini reads each post and returns its sentiment (positive/neutral/negative), a short summary, and key topics/keywords.
- **View & Filter Results** — Browse everything in a clean dashboard, filterable by sentiment, updating automatically.
- **Stay Private** — Nothing is stored on a server. All data lives in your browser only, so it's yours alone.

No Reddit account, login, or official API key is needed to scrape. You only need a free Google Gemini API key for the AI analysis step.

## Who Is This For?

- Marketers and SEO professionals researching community sentiment
- Content strategists looking for trending keywords
- Anyone curious about what a subreddit is saying about a topic

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Data Source | Reddit's unofficial `.json` endpoints |
| AI Analysis | Google Gemini AI (free tier) |
| Storage | Browser localStorage (no database) |
| Hosting | Vercel |

## How It Works

**1. You enter subreddits**
Type in one or more subreddit names, set how many posts to pull per subreddit, and choose whether to clear old data first.

**2. The app scrapes Reddit**
It fetches posts from Reddit's unofficial `.json` endpoints. No login is required, but this method is not guaranteed to keep working (see disclaimer above).

**3. Posts are saved to your browser**
Each post is stored in your browser's localStorage. This means your data stays on your device, persists across refreshes, and is never shared with other users.

**4. Gemini AI analyzes each post**
Every post's title and content is sent to Gemini, which returns:
- Sentiment (positive, neutral, or negative)
- A short plain-English summary
- Key topics/keywords

(Limited to 30 requests per minute on the free tier.)

**5. Results appear in a live dashboard**
Filter by sentiment, watch new results stream in automatically every few seconds, and clear your data anytime with one click.

## Setup Guide

### Requirements
- [Node.js](https://nodejs.org) installed on your computer
- A free [Google Gemini API key](https://ai.google.dev/)

### Steps

1. **Download the project**
   ```bash
   git clone [your-repo-url]
   cd [project-name]
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your API key**

   Create a file named `.env.local` in the project root and add:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   REDDIT_USER_AGENT="windows:my-reddit-scraper:1.0"
   ```

4. **Start the app**
   ```bash
   npm run dev
   ```

5. **Open it in your browser**
   Go to [http://localhost:3000](http://localhost:3000)

That's it — no database setup required.

## Notes

- Data is isolated per browser/session — using an incognito window or a different browser gives you a fresh, empty dataset.
- Clearing data only affects your own session; it never touches anyone else's.
- Reddit's unofficial `.json` access may stop working at any time without notice — this project is shared as-is, for learning purposes.