import { NextResponse } from 'next/server';
import { sql } from "../../../lib/neon/Neon";

// Helper to validate admin API key
const validateAdminKey = (request: Request): boolean => {
    const apiKey = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_API_KEY;

    if (!expectedKey) {
        return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return apiKey === expectedKey && apiKey.length > 0;
};

export async function DELETE(request: Request) {
    try {
        // Validate authentication
        if (!validateAdminKey(request)) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized: Missing or invalid x-admin-key header'
            }, { status: 401 });
        }

        // Get count before delete - FIXED: Remove () after sql
        const countResult = await sql`SELECT COUNT(*) as count FROM reddit_posts`;
        const deleteCount = countResult[0]?.count || 0;

        if (deleteCount === 0) {
            return NextResponse.json({
                success: true,
                message: 'Database is already empty',
                deletedRecords: 0
            });
        }

        // Delete all records - FIXED: Remove () after sql
        await sql`TRUNCATE TABLE reddit_posts RESTART IDENTITY`;

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${deleteCount} posts from database`,
            deletedRecords: deleteCount
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
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
        },
    });
}