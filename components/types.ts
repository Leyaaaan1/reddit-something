// src/types.ts
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
    scraped_at?: string;
    analysis?: AnalysisResult | null;
}

export interface AnalysisResult {
    sentiment: 'positive' | 'neutral' | 'negative';
    summary: string;
    keywords: string[];
    analysisSource?: 'ai-model' | 'keyword-fallback'; // Track analysis method
    modelUsed?: string; // Track which model was used
}


export interface ScrapeResponse {
    success: boolean;
    message: string;
    scraped: number;
    stored: number;
    analyzed: number;
    error?: string;
    storageErrors?: Array<{ post_id: string; error: string }>;
}

export interface AnalyzeResponse {
    success: boolean;
    message: string;
    analyzed: number;
    total: number;
    errors?: Array<{ post_id: string; error: string }>;
}

export interface HealthResponse {
    status: string;
    database: string;
    statistics: {
        totalRecords: number;
        analyzedRecords: number;
        pendingAnalysis: number;
        lastAnalysisTimestamp: string | null;
    };
    timestamp: string;
    error?: string;
}