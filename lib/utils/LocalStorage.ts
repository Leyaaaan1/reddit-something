import { RedditPost } from '../types';

export class LocalStorageService {
    private readonly STORAGE_KEY = 'reddit_posts_local';
    private readonly ANALYZED_KEY = 'reddit_posts_analyzed';

    // Save scraped posts
    savePosts(posts: RedditPost[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
        } catch (error) {
            console.error('Failed to save posts to localStorage:', error);
        }
    }

    // Get all posts
    getPosts(): RedditPost[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to read posts from localStorage:', error);
            return [];
        }
    }

    // Update post with analysis
    updatePostAnalysis(postId: string, analysis: any): void {
        try {
            const posts = this.getPosts();
            const updatedPosts = posts.map(post =>
                post.post_id === postId ? { ...post, analysis } : post
            );
            this.savePosts(updatedPosts);
        } catch (error) {
            console.error('Failed to update post analysis:', error);
        }
    }

    // Clear all posts
    clearPosts(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.ANALYZED_KEY);
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }

    // Get only analyzed posts
    getAnalyzedPosts(): RedditPost[] {
        try {
            const posts = this.getPosts();
            return posts.filter(post => post.analysis !== null && post.analysis !== undefined);
        } catch (error) {
            console.error('Failed to get analyzed posts:', error);
            return [];
        }
    }

    mergePosts(newPosts: RedditPost[]): number {
        const existing = this.getPosts();
        const ids = new Set(existing.map(p => p.post_id));
        const fresh = newPosts.filter(p => !ids.has(p.post_id));
        this.savePosts([...existing, ...fresh]);
        return fresh.length;
    }

    // Posts that still need analysis
    getPendingPosts(): RedditPost[] {
        return this.getPosts().filter(p => !p.analysis);
    }

    // Apply many analyses with ONE write (updatePostAnalysis rewrites everything each call)
    applyAnalyses(results: { post_id: string; analysis: any }[]): void {
        const map = new Map(results.map(r => [r.post_id, r.analysis]));
        this.savePosts(
            this.getPosts().map(p => map.has(p.post_id) ? { ...p, analysis: map.get(p.post_id) } : p)
        );
    }
}

export const localStorageService = new LocalStorageService();