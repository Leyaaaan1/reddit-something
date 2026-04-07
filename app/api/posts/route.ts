import { NextResponse } from 'next/server';
import { dbService } from "../../../lib/neon/DbService";
import { RedditPost } from "../../../lib/types";

export async function GET(request: Request) {
    try {

        // Optional: add pagination support
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100); // Max 100

        // Validate pagination parameters
        if (page < 1 || limit < 1) {
            return NextResponse.json({
                success: false,
                error: 'Invalid pagination parameters: page and limit must be >= 1'
            }, { status: 400 });
        }

        // Fetch posts from database - with proper type annotation
        let posts: RedditPost[] = [];
        try {
            const fetchedPosts = await dbService.getAllAnalyzedPosts();

            // Type guard: ensure we got an array
            if (Array.isArray(fetchedPosts)) {
                posts = fetchedPosts;
            } else {
                posts = [];
            }
        } catch (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch posts from database'
            }, { status: 500 });
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const paginatedPosts: RedditPost[] = posts.slice(startIndex, startIndex + limit);

        // Create response with pagination metadata
        const response = NextResponse.json({
            success: true,
            data: paginatedPosts,
            pagination: {
                page,
                limit,
                total: posts.length,
                totalPages: Math.ceil(posts.length / limit),
                hasMore: startIndex + limit < posts.length
            }
        });

        // Add cache headers for better performance
        response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
        response.headers.set('Content-Type', 'application/json');


        return response;

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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}