# Reddit Something

A small web app that pulls posts from public subreddits and uses Google Gemini to classify sentiment, summarize each post, and extract keywords. Results are stored in your own browser and never on a server.

> **Project status:** Reddit has announced it is ending support for public RSS feeds, which this app depends on for all of its data. The live demo is expected to stop working on **November 13, 2026**. The source code remains available for reference. <!-- Add a link to Reddit's announcement here -->

> **Disclaimer:** This is an educational hobby project, not a production tool. It is not affiliated with or endorsed by Reddit or Google. Post content belongs to its original authors and is sent to the Google Gemini API for analysis. Reddit's Terms of Service restrict some automated access, so use this responsibly and at low volume.

## Background

This project began as a pure Jupyter notebook for a Machine Learning course: no UI, no server, just cells that fetched Reddit text and analyzed it. I rebuilt it as a full-stack web app to learn what it takes to move an experiment into something others can use in a browser: environment configuration, rate limiting, failure handling, and stateless API design.

## Features

- **Fetch posts** from one or more public subreddits through Reddit's RSS feeds (no Reddit login or API key).
- **AI analysis** with Gemini 2.5 Flash: sentiment (positive / neutral / negative), a short summary, and 3-5 keywords per post.
- **Live dashboard** with sentiment filters and automatic refresh every 3 seconds.
- **Process log** that shows each step of the pipeline with timestamps and durations.
- **Private by design:** posts and analyses are stored in the browser's localStorage. The server keeps nothing.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Data source | Reddit public RSS feeds |
| AI analysis | Google Gemini 2.5 Flash |
| Storage | Browser localStorage |
| Hosting | Vercel |

## Architecture

The API routes are **stateless**. The browser owns storage, deduplication, and the analysis retry loop.

```
Browser                         Next.js API routes             External
-------                         ------------------             --------
1. POST subreddits ───────────▶ /api/scrape ─────────────────▶ Reddit RSS
   ◀─────────── posts[] ─────── (parse + return)
2. Merge into localStorage
   (skip duplicates by post_id)
3. POST pending posts ────────▶ /api/analyze ────────────────▶ Gemini API
   (batches of 5)  ◀── analyses ─ (validate + return)
4. Save analyses to localStorage
5. Dashboard reads localStorage and refreshes every 3s
```


## Usage Limits and Safeguards

- Max 4 subreddits per request, 1-10 posts each; subreddit names are validated (`[a-zA-Z0-9_]`).
- Post content is truncated to 1,000 characters.
- Analysis runs in batches of 5 with a 25-second time budget per request.
- Gemini calls are throttled (minimum 2 seconds apart, 30 per minute) with a capped output size and a request timeout.
- Gemini responses are schema-validated; invalid output is rejected.
- Duplicate posts are skipped, and posts that fail analysis are not retried endlessly within a run.
- Reddit requests use a descriptive User-Agent and a delay between subreddits.

## Getting Started

### Requirements

- [Node.js](https://nodejs.org) 18 or later
- A free [Google Gemini API key](https://ai.google.dev/)

### Installation

```bash
git clone https://github.com/Leyaaaan1/reddit-something.git
cd reddit-something
npm install
```

### Configuration

Create a `.env.local` file in the project root:

```bash
gemini_api_key=your_gemini_api_key
REDDIT_USER_AGENT="web:reddit-something:1.0 (by /u/your_username)"
```

| Variable | Required | Description |
|---|---|---|
| `gemini_api_key` | Yes | Gemini API key. The name is lowercase, matching the code. |
| `REDDIT_USER_AGENT` | Recommended | Descriptive User-Agent with a way to contact you. Falls back to a default if unset. |

Never commit real keys. `.env*` files should be listed in `.gitignore`.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

When deploying to Vercel, add both variables under **Project Settings → Environment Variables**.

## Known Limitations

- **No scores or comment counts.** RSS feeds don't include them, so those fields are empty.
- **Reddit availability.** Reddit can rate-limit or block requests, especially from cloud hosts, and may remove RSS support entirely.
- **Browser-only storage.** Data is per browser and per device, limited to roughly 5 MB, and lost if site data is cleared.
- **Public API routes.** There is no authentication. The Gemini rate limiter is per server instance and the free-tier quota is the real ceiling, so heavy use can exhaust it.
- **LLM accuracy.** Sentiment labels can be wrong, particularly with sarcasm, slang, or mixed languages such as Taglish.

