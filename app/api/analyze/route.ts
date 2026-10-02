import { NextResponse } from 'next/server';
import { geminiService } from "../../../lib/services/GemeniService";

const MAX_POSTS_PER_CALL = 5;
const MAX_EXECUTION_TIME = 25000;

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        if (!Array.isArray(body.posts) || body.posts.length === 0) {
            return NextResponse.json(
                { success: false, error: 'posts must be a non-empty array' },
                { status: 400 }
            );
        }

        const batch = body.posts.slice(0, MAX_POSTS_PER_CALL);
        const results: { post_id: string; analysis: any }[] = [];
        const errors: { post_id: string; error: string }[] = [];

        for (const post of batch) {
            if (Date.now() - startTime > MAX_EXECUTION_TIME) break;

            if (!post?.post_id || typeof post.title !== 'string') {
                errors.push({ post_id: post?.post_id ?? 'unknown', error: 'Invalid post shape' });
                continue;
            }

            try {
                const analysis = await geminiService.analyzeText(post.title, post.content ?? '');
                if (analysis) {
                    results.push({ post_id: post.post_id, analysis });
                } else {
                    errors.push({ post_id: post.post_id, error: 'Analysis returned null' });
                }
            } catch (e) {
                errors.push({
                    post_id: post.post_id,
                    error: e instanceof Error ? e.message : 'Unknown error',
                });
            }
        }

        return NextResponse.json({
            success: true,
            analyzed: results.length,
            results,
            errors: errors.length ? errors : undefined,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown server error' },
            { status: 500 }
        );
    }
}