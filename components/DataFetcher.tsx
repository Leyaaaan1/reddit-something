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
    const [loading, setLoading]                 = useState(false);
    const [clearing, setClearing]               = useState(false);
    const [error, setError]                     = useState<string | null>(null);
    const [result, setResult]                   = useState<ScrapeResponse | null>(null);
    const [subreddits, setSubreddits]           = useState('socialmedia,marketing,SocialMediaMarketing,digital_marketing,socialmediamanagers');
    const [postsPerSubreddit, setPostsPerSubreddit] = useState(5);
    const [clearBeforeScrape, setClearBeforeScrape] = useState(true);
    const [processLogs, setProcessLogs]         = useState<ProcessLog[]>([]);
    const [showLogs, setShowLogs]               = useState(false);
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
            try {
                await axios.delete('/api/clear', { headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || '' } });
            } catch { /* db clear optional */ }
            addLog('✓ Posts cleared from local storage', 'success', { service: 'Local Storage', operation: 'clear_complete' });
            alert('All posts cleared!');
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
                const clearStart = Date.now();
                addLog('Clearing old data from local storage...', 'info', { service: 'Local Storage', operation: 'truncate', level: 1 });
                try {
                    localStorageService.clearPosts();
                    addLog('✓ Old data cleared', 'success', { service: 'Local Storage', operation: 'truncate', level: 1, duration: Date.now() - clearStart });
                } catch (clearErr) {
                    addLog('Failed to clear old data (continuing anyway)', 'warning', {
                        service: 'Local Storage', operation: 'truncate',
                        details: clearErr instanceof Error ? clearErr.message : String(clearErr)
                    });
                }
            } else {
                addLog('Skipping local storage clear (append mode)', 'info', { service: 'Local Storage', operation: 'append_mode', level: 1 });
            }

            const subredditArray = subreddits.split(',').map(s => s.trim()).filter(s => s);
            const totalExpectedPosts = subredditArray.length * postsPerSubreddit;

            addLog(
                `Scraping ${subredditArray.length} subreddits (${postsPerSubreddit} posts each)...`,
                'info',
                { service: 'Reddit', operation: 'scrape_request', details: `Subreddits: ${subredditArray.join(', ')}\nPosts per subreddit: ${postsPerSubreddit}\nTotal expected: ${totalExpectedPosts} posts` }
            );

            setCurrentProcessing({ subreddit: subredditArray[0], postCount: 0, totalPosts: totalExpectedPosts });

            const scrapeStart = Date.now();
            const progressInterval = setInterval(() => {
                setCurrentProcessing(prev => ({
                    ...prev,
                    postCount: Math.min((prev.postCount || 0) + Math.floor(Math.random() * 3), prev.totalPosts || 0)
                }));
            }, 500);

            const response = await axios.post<ScrapeResponse>('/api/scrape', {
                subreddits: subredditArray,
                postsPerSubreddit
            });

            clearInterval(progressInterval);
            const scrapeDuration = Date.now() - scrapeStart;

            addLog(`✓ Scraping complete: ${response.data.scraped} posts scraped`, 'success', {
                service: 'Reddit', operation: 'scrape_complete', duration: scrapeDuration,
                details: `Scraped: ${response.data.scraped}\nStored: ${response.data.stored}\nAnalyzed: ${response.data.analyzed}`
            });

            for (let i = 0; i < subredditArray.length; i++) {
                const postsFromThisSub = Math.min(postsPerSubreddit, response.data.scraped - i * postsPerSubreddit);
                if (postsFromThisSub > 0) {
                    addLog(`${postsFromThisSub} posts from r/${subredditArray[i]}`, 'info', {
                        service: 'Reddit', operation: 'subreddit_complete', level: 2,
                        postData: { subreddit: subredditArray[i] }
                    });
                }
            }

            addLog(`${response.data.stored} posts stored in database`, 'info', { service: 'Database', operation: 'store', level: 1 });
            addLog(`${response.data.analyzed} posts analyzed with Gemini AI`, 'info', { service: 'Gemini', operation: 'analyze', level: 1 });

            if (response.data.storageErrors?.length) {
                addLog(`${response.data.storageErrors.length} storage errors occurred`, 'warning', {
                    service: 'Database', operation: 'error_report',
                    details: response.data.storageErrors.map(e => `- ${e.post_id}: ${e.error}`).join('\n')
                });
            }

            setResult(response.data);
            setCurrentProcessing({ subreddit: 'Complete', postCount: response.data.stored, totalPosts: response.data.scraped });

            // Save to localStorage
            try {
                addLog('Saving posts to local storage...', 'info', { service: 'Local Storage', operation: 'save_start', level: 1 });
                const postsResponse = await axios.get<any>('/api/posts');
                const postsData = postsResponse.data?.data || [];
                if (Array.isArray(postsData) && postsData.length > 0) {
                    const existingPosts = localStorageService.getPosts();
                    const mergedPosts = [
                        ...existingPosts.filter(ep => !postsData.some((np: any) => np.post_id === ep.post_id)),
                        ...postsData
                    ];
                    localStorageService.savePosts(mergedPosts);
                    addLog(`✓ ${postsData.length} posts saved to local storage`, 'success', { service: 'Local Storage', operation: 'save_complete', level: 1 });
                }
            } catch (err) {
                addLog('Failed to save posts to local storage', 'warning', {
                    service: 'Local Storage', operation: 'save_failed',
                    details: err instanceof Error ? err.message : String(err)
                });
            }

            const totalDuration = Date.now() - startTime;
            if (response.data.success) {
                addLog('🎉 Process completed successfully!', 'success', { service: 'Server', operation: 'scrape_complete', duration: totalDuration });
                onSuccess();
            } else {
                addLog('Process completed with issues', 'warning', { service: 'Server', operation: 'scrape_complete_with_issues', duration: totalDuration });
            }
        } catch (err) {
            const errorMsg = axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : 'An unknown error occurred';
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
                        Scrape Reddit Posts
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
                    Clear old data before scraping new subreddits
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
                    {loading ? '⏳ Scraping… (this may take a few minutes)' : '▶ Start Scraping'}
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