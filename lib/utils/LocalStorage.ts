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
}

export const localStorageService = new LocalStorageService();