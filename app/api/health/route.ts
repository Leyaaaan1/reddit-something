import { NextResponse } from 'next/server';
import { sql } from "../../../lib/neon/Neon";

export async function GET() {
    const healthStartTime = Date.now();

    try {

        // Get total analyzed records count
        const analyzedResult = await sql`
            SELECT COUNT(*) as count FROM reddit_posts WHERE analysis IS NOT NULL
        `;
        const analyzedCount = analyzedResult[0]?.count || 0;

        // Get total records count
        const totalResult = await sql`
            SELECT COUNT(*) as count FROM reddit_posts
        `;
        const totalCount = totalResult[0]?.count || 0;

        // Get last analyzed post timestamp
        const lastAnalyzedResult = await sql`
            SELECT scraped_at
            FROM reddit_posts
            WHERE analysis IS NOT NULL
            ORDER BY scraped_at DESC
                LIMIT 1
        `;
        const lastAnalysisTime = lastAnalyzedResult.length > 0
            ? lastAnalyzedResult[0].scraped_at
            : null;

        const response = NextResponse.json({
            status: 'healthy',
            database: 'connected',
            statistics: {
                totalRecords: totalCount,
                analyzedRecords: analyzedCount,
                pendingAnalysis: totalCount - analyzedCount,
                lastAnalysisTimestamp: lastAnalysisTime
            },
            timestamp: new Date().toISOString(),
            responseTime: `${Date.now() - healthStartTime}ms`
        });

        // Add cache headers
        response.headers.set('Cache-Control', 'public, max-age=10');


        return response;

    } catch (error) {

        return NextResponse.json({
            status: 'unhealthy',
            database: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 503 });
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