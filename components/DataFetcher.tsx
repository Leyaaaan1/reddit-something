import React, { useState } from 'react';
import axios from 'axios';
import { ScrapeResponse } from './types';
import ProcessLogger, { ProcessLog } from './ProcessLogger';
import { localStorageService } from '../lib/utils/LocalStorage';

interface DataFetcherProps {
    onSuccess: () => void;
}

interface CurrentProcessingState {
    subreddit?: string;
    postCount?: number;
    totalPosts?: number;
    currentPostTitle?: string;
    currentAuthor?: string;
}

const DataFetcher: React.FC<DataFetcherProps> = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ScrapeResponse | null>(null);
    const [subreddits, setSubreddits] = useState('Philippines');
    const [postsPerSubreddit, setPostsPerSubreddit] = useState(5);
    const [clearBeforeScrape, setClearBeforeScrape] = useState(true);
    const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [currentProcessing, setCurrentProcessing] = useState<CurrentProcessingState>({});

    const addLog = (
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' | 'debug' = 'info',
        options?: {
            service?: string;
            operation?: string;
            duration?: number;
            details?: string;
            level?: number;
            postData?: { title?: string; subreddit?: string; author?: string; score?: number; url?: string };
        }
    ) => {
        const newLog: ProcessLog = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString(),
            message,
            type,
            ...options
        };
        setProcessLogs(prev => [...prev, newLog]);
    };

    const clearLogs = () => setProcessLogs([]);

    const handleClearDatabase = async () => {
        if (!confirm('Are you sure you want to delete all posts? This action cannot be undone.')) return;
        setClearing(true);
        setError(null);
        clearLogs();
        setShowLogs(true);
        addLog('Clearing posts...', 'info', { service: 'Local Storage', operation: 'clear_all' });
        try {
            localStorageService.clearPosts();
            addLog('✓ Posts cleared from local storage', 'success', { service: 'Local Storage', operation: 'clear_complete' });
            onSuccess();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to clear';
            addLog(errorMsg, 'error', { service: 'Local Storage', operation: 'error' });
            setError(errorMsg);
        } finally {
            setClearing(false);
        }
    };

    const handleScrape = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        clearLogs();
        setShowLogs(true);
        setCurrentProcessing({});
        const startTime = Date.now();

        try {
            addLog('🚀 Starting Reddit scrape process...', 'info', { service: 'Server', operation: 'scrape_init' });

            if (clearBeforeScrape) {
                try {
                    localStorageService.clearPosts();
                    addLog('✓ Old data cleared', 'success', { service: 'Local Storage', operation: 'truncate', level: 1 });
                } catch (clearErr) {
                    addLog('Failed to clear old data (continuing anyway)', 'warning', {
                        service: 'Local Storage', operation: 'truncate',
                        details: clearErr instanceof Error ? clearErr.message : String(clearErr)
                    });
                }
            } else {
                addLog('Append mode: keeping existing posts', 'info', { service: 'Local Storage', operation: 'append_mode', level: 1 });
            }

            const subredditArray = subreddits.split(',').map(s => s.trim()).filter(s => s);
            const totalExpectedPosts = subredditArray.length * postsPerSubreddit;

            addLog(`Scraping ${subredditArray.length} subreddits (${postsPerSubreddit} posts each)...`, 'info', {
                service: 'Reddit', operation: 'scrape_request',
                details: `Subreddits: ${subredditArray.join(', ')}\nPosts per subreddit: ${postsPerSubreddit}\nTotal expected: ${totalExpectedPosts} posts`
            });
            setCurrentProcessing({ subreddit: subredditArray.join(', '), postCount: 0, totalPosts: totalExpectedPosts });

            // ── 1. Scrape (server returns posts, stores nothing) ──
            const scrapeStart = Date.now();
            const response = await axios.post<ScrapeResponse>('/api/scrape', {
                subreddits: subredditArray,
                postsPerSubreddit
            });
            if (!response.data.success) throw new Error(response.data.error || 'Scrape failed');

            const scrapedPosts = response.data.posts ?? [];
            addLog(`✓ Scraping complete: ${scrapedPosts.length} posts scraped`, 'success', {
                service: 'Reddit', operation: 'scrape_complete', duration: Date.now() - scrapeStart
            });
            for (const sub of subredditArray) {
                const n = scrapedPosts.filter(p => p.source.toLowerCase() === sub.toLowerCase()).length;
                addLog(`${n} posts from r/${sub}`, n > 0 ? 'info' : 'warning', {
                    service: 'Reddit', operation: 'subreddit_complete', level: 2
                });
            }

            // ── 2. Save to localStorage (skips duplicates) ──
            addLog('Saving posts to local storage...', 'info', { service: 'Local Storage', operation: 'save_start', level: 1 });
            const stored = localStorageService.mergePosts(scrapedPosts);
            addLog(`✓ ${stored} new posts saved to local storage`, 'success', { service: 'Local Storage', operation: 'save_complete', level: 1 });

            // ── 3. Analyze in batches of 5 via /api/analyze ──
            const BATCH_SIZE = 5;
            const failed = new Set<string>();
            let analyzed = 0;
            const totalToAnalyze = localStorageService.getPendingPosts().length;
            setCurrentProcessing({ subreddit: 'Gemini analysis', postCount: 0, totalPosts: totalToAnalyze });

            while (true) {
                const batch = localStorageService.getPendingPosts()
                    .filter(p => !failed.has(p.post_id))
                    .slice(0, BATCH_SIZE);
                if (batch.length === 0) break;

                const batchStart = Date.now();
                try {
                    const res = await axios.post<{
                        success: boolean;
                        results: { post_id: string; analysis: any }[];
                        errors?: { post_id: string; error: string }[];
                    }>('/api/analyze', {
                        posts: batch.map(p => ({ post_id: p.post_id, title: p.title, content: p.content }))
                    });

                    const results = res.data.results ?? [];
                    localStorageService.applyAnalyses(results);
                    const okIds = new Set(results.map(r => r.post_id));
                    batch.forEach(p => { if (!okIds.has(p.post_id)) failed.add(p.post_id); });
                    analyzed += results.length;

                    addLog(`Analyzed ${results.length}/${batch.length} posts in this batch`,
                        results.length === batch.length ? 'success' : 'warning', {
                        service: 'Gemini', operation: 'analyze', level: 1, duration: Date.now() - batchStart,
                        details: res.data.errors?.map(e => `- ${e.post_id}: ${e.error}`).join('\n')
                    });
                } catch (batchErr) {
                    batch.forEach(p => failed.add(p.post_id));
                    addLog('Analyze request failed for this batch', 'error', {
                        service: 'Gemini', operation: 'analyze_error', level: 1,
                        details: axios.isAxiosError(batchErr)
                            ? (batchErr.response?.data?.error || batchErr.message)
                            : String(batchErr)
                    });
                }
                setCurrentProcessing({ subreddit: 'Gemini analysis', postCount: analyzed, totalPosts: totalToAnalyze });
            }

            // ── 4. Finish ──
            const totalDuration = Date.now() - startTime;
            setResult({
                success: true,
                message: 'Scrape and analysis complete',
                scraped: scrapedPosts.length,
                stored,
                analyzed
            });
            setCurrentProcessing({ subreddit: 'Complete', postCount: analyzed, totalPosts: totalToAnalyze });
            addLog('🎉 Process completed successfully!', 'success', { service: 'Server', operation: 'scrape_complete', duration: totalDuration });
            onSuccess();
        } catch (err) {
            const errorMsg = axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : (err instanceof Error ? err.message : 'An unknown error occurred');
            addLog(`Error: ${errorMsg}`, 'error', { service: 'Server', operation: 'error', details: err instanceof Error ? err.stack : String(err) });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };



    // ── Input shared styles ──────────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.5rem 0.875rem',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        outline: 'none',
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--text-secondary)',
        marginBottom: '0.25rem'
    };

    return (
        <>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem' }}>
                <div style={{ background: '#dbeafe', padding: '0.4rem', borderRadius: '0.5rem' }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                        Fetch Reddit Posts
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                        Fetch data from Reddit and store locally
                    </p>
                </div>
            </div>

            {/* Subreddits input */}
            <div style={{ marginBottom: '0.875rem' }}>
                <label style={labelStyle}>Subreddits (comma-separated)</label>
                <input
                    type="text"
                    value={subreddits}
                    onChange={e => setSubreddits(e.target.value)}
                    disabled={loading || clearing}
                    placeholder="socialmedia,marketing,digitalmarketing"
                    style={inputStyle}
                />
            </div>

            {/* Posts per subreddit */}
            <div style={{ marginBottom: '0.875rem' }}>
                <label style={labelStyle}>Posts per subreddit</label>
                <input
                    type="number"
                    value={postsPerSubreddit}
                    onChange={e => setPostsPerSubreddit(Number(e.target.value))}
                    disabled={loading || clearing}
                    min="1" max="50"
                    style={{ ...inputStyle, width: '120px' }}
                />
            </div>

            {/* Clear before scrape */}
            <div style={{
                marginBottom: '1.25rem',
                padding: '0.75rem',
                background: 'var(--warn-bg)',
                border: '1px solid var(--warn-border)',
                borderRadius: '0.5rem'
            }}>
                <label style={{
                    display: 'flex', alignItems: 'center',
                    fontSize: '0.875rem', fontWeight: '500',
                    color: 'var(--warn-text)', cursor: 'pointer'
                }}>
                    <input
                        type="checkbox"
                        checked={clearBeforeScrape}
                        onChange={e => setClearBeforeScrape(e.target.checked)}
                        disabled={loading || clearing}
                        style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', cursor: 'pointer' }}
                    />
                    Clear old data before fetching new subreddits
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--warn-sub)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                    Recommended: This will delete all previous posts to show only new results
                </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    onClick={handleScrape}
                    disabled={loading || clearing}
                    style={{
                        flex: 1,
                        background: loading ? '#9ca3af' : '#2563eb',
                        color: 'white',
                        fontWeight: '600',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: loading || clearing ? 'not-allowed' : 'pointer',
                        fontSize: '0.9375rem'
                    }}
                >
                    {loading ? '⏳ Fetching (this may take a few minutes)' : '▶ Fetch Posts'}
                </button>
                <button
                    onClick={handleClearDatabase}
                    disabled={loading || clearing}
                    style={{
                        background: clearing ? '#9ca3af' : '#dc2626',
                        color: 'white',
                        fontWeight: '600',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: loading || clearing ? 'not-allowed' : 'pointer',
                        fontSize: '0.9375rem',
                        whiteSpace: 'nowrap'
                    }}
                    title="Clear all posts from local storage"
                >
                    {clearing ? 'Clearing…' : '🗑️ Clear All'}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '0.875rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
                    <p style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>Error: {error}</p>
                </div>
            )}

            {/* Result */}
            {result && (
                <div style={{
                    padding: '0.875rem',
                    background: result.success ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: '0.5rem',
                    marginBottom: '0.75rem'
                }}>
                    <p style={{ fontWeight: '600', color: result.success ? '#166534' : '#991b1b', marginBottom: '0.5rem' }}>
                        {result.message}
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Scraped: <b style={{ color: 'var(--text-primary)' }}>{result.scraped}</b></span>
                        <span style={{ color: 'var(--text-secondary)' }}>Stored: <b style={{ color: 'var(--text-primary)' }}>{result.stored}</b></span>
                        <span style={{ color: 'var(--text-secondary)' }}>Analyzed: <b style={{ color: 'var(--text-primary)' }}>{result.analyzed}</b></span>
                    </div>
                </div>
            )}

            {/* Inline process logger (appears when scraping starts) */}
            <ProcessLogger
                logs={processLogs}
                isVisible={showLogs}
                currentProcessing={currentProcessing}
            />
        </>
    );
};

export default DataFetcher;