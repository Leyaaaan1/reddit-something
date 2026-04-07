import { sql } from './Neon';
import { RedditPost, AnalysisResult } from '../types';

export class DbService {

    async insertPost(post: RedditPost): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const result = await sql`
                INSERT INTO reddit_posts (
                    post_id, source, title, content, author, score,
                    num_comments, url, created_at, scraped_at, analysis
                ) VALUES (
                             ${post.post_id}, ${post.source}, ${post.title}, ${post.content},
                             ${post.author}, ${post.score}, ${post.num_comments}, ${post.url},
                             ${post.created_at}, ${new Date().toISOString()}, null
                         )
                    RETURNING id
            `;

            if (result.length === 0) {
                return { success: false, error: 'No result returned from insert' };
            }

            return { success: true, id: result[0].id };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            return { success: false, error: errorMsg };
        }
    }


    async updateAnalysis(postId: string, analysis: AnalysisResult): Promise<{ success: boolean; error?: string }> {
        try {
            await sql`
                UPDATE reddit_posts
                SET analysis = ${JSON.stringify(analysis)}::jsonb
                WHERE post_id = ${postId}
            `;

            return { success: true };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            return { success: false, error: errorMsg };
        }
    }


    async getPostsWithoutAnalysis(): Promise<RedditPost[]> {
        try {
            const data = await sql`
                SELECT *
                FROM reddit_posts
                WHERE analysis IS NULL
                ORDER BY created_at DESC
            ` as RedditPost[];

            return data || [];
        } catch (err) {
            return [];
        }
    }


    async postExists(postId: string): Promise<boolean> {
        try {
            const result = await sql`
                SELECT 1
                FROM reddit_posts
                WHERE post_id = ${postId}
                    LIMIT 1
            `;

            return result.length > 0;
        } catch {
            return false;
        }
    }


    async getAllAnalyzedPosts(): Promise<RedditPost[]> {
        try {
            const data = await sql`
                SELECT *
                FROM reddit_posts
                ORDER BY created_at DESC
                ` as RedditPost[];

            return data || [];
        } catch (err) {
            return [];
        }
    }


}

export const dbService = new DbService();