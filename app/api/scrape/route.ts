import { NextResponse } from 'next/server';
import { apifyService } from "../../../lib/services/RedditScrape";

const validateScrapeRequest = (data: any) => {
  if (!Array.isArray(data.subreddits) || data.subreddits.length === 0) {
    throw new Error('Invalid subreddits: must be non-empty array');
  }
  if (data.subreddits.length > 20) throw new Error('Max 20 subreddits allowed');
  if (typeof data.postsPerSubreddit !== 'number' ||
    data.postsPerSubreddit < 1 || data.postsPerSubreddit > 50) {
    throw new Error('Invalid postsPerSubreddit (must be 1-50)');
  }
  const valid = /^[a-zA-Z0-9_]+$/;
  for (const sub of data.subreddits) {
    if (typeof sub !== 'string' || !valid.test(sub) || sub.length > 50) {
      throw new Error(`Invalid subreddit name: ${sub}`);
    }
  }
};

export async function POST(request: Request) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 });
    }

    let body;
    try { body = await request.json(); }
    catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 });
    }

    try { validateScrapeRequest(body); }
    catch (e) {
      return NextResponse.json(
        { success: false, error: e instanceof Error ? e.message : 'Validation failed' },
        { status: 400 });
    }

    const posts = await apifyService.scrapeRedditPosts(
      body.subreddits, body.postsPerSubreddit);

    return NextResponse.json({ success: true, scraped: posts.length, posts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 });
  }
}