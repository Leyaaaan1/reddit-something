import { NextResponse } from 'next/server';
import { apifyService } from "../../../lib/services/RedditScrape";
import { dbService } from "../../../lib/neon/DbService";
import { RateLimiter, delay } from "../../../lib/utils/ErrorHandler";
import { geminiService } from "../../../lib/services/GemeniService";
import {sql} from "../../../lib/neon/Neon";

const rateLimiter = new RateLimiter(1); // 1 call per second for Gemini

// Input validation
const validateScrapeRequest = (data: any) => {
  if (!Array.isArray(data.subreddits) || data.subreddits.length === 0) {
    throw new Error('Invalid subreddits: must be non-empty array');
  }
  if (data.subreddits.length > 20) {
    throw new Error('Max 20 subreddits allowed');
  }
  if (typeof data.postsPerSubreddit !== 'number' ||
      data.postsPerSubreddit < 1 || data.postsPerSubreddit > 50) {
    throw new Error('Invalid postsPerSubreddit (must be 1-50)');
  }
  // Validate subreddit names (alphanumeric + underscore)
  const validSubredditPattern = /^[a-zA-Z0-9_]+$/;
  for (const sub of data.subreddits) {
    if (!validSubredditPattern.test(sub) || sub.length > 50) {
      throw new Error(`Invalid subreddit name: ${sub}`);
    }
  }
};

// Set timeout helper for long operations
const withTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
};

export async function POST(request: Request) {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 25000; // 25 seconds (leaving 5s buffer for Vercel's 30s limit)
  const MAX_POSTS_TO_ANALYZE = 50; // Limit posts to prevent timeout

  try {
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({
        success: false,
        error: 'Content-Type must be application/json'
      }, { status: 400 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 });
    }

    // Apply validation
    try {
      validateScrapeRequest(body);
    } catch (validationError) {
      return NextResponse.json({
        success: false,
        error: validationError instanceof Error ? validationError.message : 'Validation failed'
      }, { status: 400 });
    }

    const { subreddits, postsPerSubreddit } = body;


    // Check timeout
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      return NextResponse.json({
        success: false,
        error: 'Operation timeout: took too long to process request'
      }, { status: 408 });
    }

    // Step 1: Scrape Reddit posts
    let posts;
    try {
      posts = await withTimeout(
          apifyService.scrapeRedditPosts(subreddits, postsPerSubreddit),
          15000,
          'Reddit scraping timeout after 15s'
      );
    } catch (scrapeError) {
      return NextResponse.json({
        success: false,
        error: scrapeError instanceof Error ? scrapeError.message : 'Scraping failed',
        scraped: 0,
        stored: 0,
        analyzed: 0
      }, { status: 500 });
    }

    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No posts scraped from Reddit',
        scraped: 0,
        stored: 0,
        analyzed: 0
      }, { status: 200 });
    }


    // Check timeout
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      return NextResponse.json({
        success: true,
        message: 'Scraping complete, analysis skipped due to timeout',
        scraped: posts.length,
        stored: 0,
        analyzed: 0
      }, { status: 200 });
    }

    // Step 2: Store posts in database
    let storedCount = 0;
    const storedPosts = [];
    const storageErrors = [];

    for (const post of posts) {
      try {
        const exists = await dbService.postExists(post.post_id);

        if (exists) {
          continue;
        }

        const result = await dbService.insertPost(post);

        if (result.success) {
          storedCount++;
          storedPosts.push(post);
        } else {
          storageErrors.push({
            post_id: post.post_id,
            error: result.error || 'Unknown error'
          });
        }

        await delay(100); // Small delay between database operations
      } catch (error) {
        storageErrors.push({
          post_id: post.post_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }


    // Check timeout before analysis
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      return NextResponse.json({
        success: true,
        message: 'Scraping complete, analysis skipped due to timeout',
        scraped: posts.length,
        stored: storedCount,
        analyzed: 0
      }, { status: 200 });
    }


    // Step 3: Analyze posts (limit to prevent timeout)
    let analyzedCount = 0;
    const postsToAnalyze = storedPosts.slice(0, MAX_POSTS_TO_ANALYZE);

    for (const post of postsToAnalyze) {
      // Check timeout before each analysis
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        break;
      }

      try {
        await rateLimiter.wait();


        const analysis = await geminiService.analyzeText(post.title, post.content);

        if (analysis) {
          const updateResult = await dbService.updateAnalysis(post.post_id, analysis);

          if (updateResult.success) {
            analyzedCount++;
          } else {
          }
        } else {
        }
      } catch (error) {
      }
    }


    return NextResponse.json({
      success: true,
      message: 'Scrape and analysis complete',
      scraped: posts.length,
      stored: storedCount,
      analyzed: analyzedCount,
      storageErrors: storageErrors.length > 0 ? storageErrors : undefined
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM reddit_posts`;
    return NextResponse.json({
      success: true,
      totalPosts: result[0]?.count || 0,
      message: 'Connection successful'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    }, { status: 500 });
  }
}


// Add CORS headers
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}