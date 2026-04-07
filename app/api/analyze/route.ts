import { NextResponse } from 'next/server';
import { RateLimiter } from "../../../lib/utils/ErrorHandler";
import { geminiService } from "../../../lib/services/GemeniService";
import { dbService } from "../../../lib/neon/DbService";

const rateLimiter = new RateLimiter(0.25); // 1 request per 4 seconds

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
    const MAX_EXECUTION_TIME = 25000; // 25 seconds
    const MAX_POSTS_TO_ANALYZE = 5; // Process max 5 posts to avoid timeout

    try {

        // Get posts that don't have analysis yet
        let posts;
        try {
            posts = await withTimeout(
                dbService.getPostsWithoutAnalysis(),
                10000,
                'Fetching posts timeout'
            );
        } catch (fetchError) {
            return NextResponse.json({
                success: false,
                error: fetchError instanceof Error ? fetchError.message : 'Failed to fetch posts'
            }, { status: 500 });
        }

        if (posts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No posts to analyze',
                analyzed: 0,
                total: 0
            });
        }


        let analyzedCount = 0;
        const errors = [];
        const postsToProcess = posts.slice(0, MAX_POSTS_TO_ANALYZE);

        for (const post of postsToProcess) {
            // Check timeout
            if (Date.now() - startTime > MAX_EXECUTION_TIME) {
                break;
            }

            try {
                // Rate limit API calls
                await rateLimiter.wait();


                const analysis = await geminiService.analyzeText(post.title, post.content);

                if (analysis) {
                    const result = await dbService.updateAnalysis(post.post_id, analysis);

                    if (result.success) {
                        analyzedCount++;
                    } else {
                        errors.push({
                            post_id: post.post_id,
                            error: result.error || 'Unknown error'
                        });
                    }
                } else {
                    errors.push({
                        post_id: post.post_id,
                        error: 'Analysis returned null'
                    });
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                errors.push({ post_id: post.post_id, error: errorMsg });
            }
        }


        return NextResponse.json({
            success: true,
            message: `Analyzed ${analyzedCount}/${posts.length} posts`,
            analyzed: analyzedCount,
            total: posts.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown server error'
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}