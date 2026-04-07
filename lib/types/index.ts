export interface RedditPost {
    post_id: string;
    source: string;
    title: string;
    content: string;
    author: string;
    score: number;
    num_comments: number;
    url: string;
    created_at: string;
    analysis?: AnalysisResult | null;  // Add this line
}

export interface AnalysisResult {
    sentiment: 'positive' | 'neutral' | 'negative';
    summary: string;
    keywords: string[];
}