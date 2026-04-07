import React, { useState } from 'react';
import axios from 'axios';
import { ScrapeResponse } from "./types";
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
    const [subreddits, setSubreddits] = useState('socialmedia,marketing,SocialMediaMarketing,digital_marketing,socialmediamanagers');
    const [postsPerSubreddit, setPostsPerSubreddit] = useState(5);
    const [clearBeforeScrape, setClearBeforeScrape] = useState(true);
    const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [currentProcessing, setCurrentProcessing] = useState<CurrentProcessingState>({});

    // Enhanced addLog with post data
    const addLog = (
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' | 'debug' = 'info',
        options?: {
            service?: string;
            operation?: string;
            duration?: number;
            details?: string;
            level?: number;
            postData?: {
                title?: string;
                subreddit?: string;
                author?: string;
                score?: number;
                url?: string;
            };
        }
    ) => {
        const timestamp = new Date().toLocaleTimeString();
        const newLog: ProcessLog = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp,
            message,
            type,
            ...options
        };
        setProcessLogs((prev) => [...prev, newLog]);
        console.log(`[${type.toUpperCase()}] ${message}`, options);
    };

    const clearLogs = () => {
        setProcessLogs([]);
    };

    const handleClearDatabase = async () => {
        if (!confirm('Are you sure you want to delete all posts? This action cannot be undone.')) {
            return;
        }

        setClearing(true);
        setError(null);
        clearLogs();
        setShowLogs(true);

        addLog('Clearing posts...', 'info', {
            service: 'Local Storage',
            operation: 'clear_all'
        });

        try {
            // Clear from localStorage
            localStorageService.clearPosts();

            // Also clear from database for consistency
            try {
                await axios.delete('/api/clear', {
                    headers: {
                        'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || ''
                    }
                });
            } catch (dbErr) {
                // Database clear failed, but localStorage was cleared
                console.warn('Database clear failed:', dbErr);
            }

            addLog('✓ Posts cleared from local storage', 'success', {
                service: 'Local Storage',
                operation: 'clear_complete'
            });

            alert('All posts cleared!');
            onSuccess();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to clear';
            addLog(errorMsg, 'error', {
                service: 'Local Storage',
                operation: 'error'
            });
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
        let totalScraped = 0;

        try {
            addLog('🚀 Starting Reddit scrape process...', 'info', {
                service: 'Server',
                operation: 'scrape_init'
            });

            // Clear localStorage if option is checked
            if (clearBeforeScrape) {
                try {
                    const clearStart = Date.now();
                    addLog('Clearing old data from local storage...', 'info', {
                        service: 'Local Storage',
                        operation: 'truncate',
                        level: 1
                    });

                    localStorageService.clearPosts();

                    const clearDuration = Date.now() - clearStart;
                    addLog('✓ Old data cleared', 'success', {
                        service: 'Local Storage',
                        operation: 'truncate',
                        level: 1,
                        duration: clearDuration
                    });
                } catch (clearErr) {
                    addLog('Failed to clear old data (continuing anyway)', 'warning', {
                        service: 'Local Storage',
                        operation: 'truncate',
                        details: clearErr instanceof Error ? clearErr.message : String(clearErr)
                    });
                }
            } else {
                addLog('Skipping local storage clear (append mode)', 'info', {
                    service: 'Local Storage',
                    operation: 'append_mode',
                    level: 1
                });
            }

            // Prepare request
            const subredditArray = subreddits.split(',').map(s => s.trim()).filter(s => s);
            const totalExpectedPosts = subredditArray.length * postsPerSubreddit;

            addLog(
                `Scraping ${subredditArray.length} subreddits (${postsPerSubreddit} posts each)...`,
                'info',
                {
                    service: 'Reddit',
                    operation: 'scrape_request',
                    details: `Subreddits: ${subredditArray.join(', ')}\nPosts per subreddit: ${postsPerSubreddit}\nTotal expected: ${totalExpectedPosts} posts`
                }
            );

            // Update current processing
            setCurrentProcessing({
                subreddit: subredditArray[0],
                postCount: 0,
                totalPosts: totalExpectedPosts
            });

            // Make scrape request with progress tracking
            const scrapeStart = Date.now();

            // Simulate progress updates (in real scenario, backend would send stream)
            const progressInterval = setInterval(() => {
                setCurrentProcessing(prev => ({
                    ...prev,
                    postCount: Math.min((prev.postCount || 0) + Math.floor(Math.random() * 3), prev.totalPosts || 0)
                }));
            }, 500);

            const response = await axios.post<ScrapeResponse>('/api/scrape', {
                subreddits: subredditArray,
                postsPerSubreddit: postsPerSubreddit
            });

            clearInterval(progressInterval);
            totalScraped = response.data.scraped;
            const scrapeDuration = Date.now() - scrapeStart;

            // Log scraping completion
            addLog(
                `✓ Scraping complete: ${response.data.scraped} posts scraped`,
                'success',
                {
                    service: 'Reddit',
                    operation: 'scrape_complete',
                    duration: scrapeDuration,
                    details: `Scraped: ${response.data.scraped}\nStored: ${response.data.stored}\nDuplicates: ${response.data.scraped - response.data.stored}\nAnalyzed: ${response.data.analyzed}\n\nScraped from subreddits: ${subredditArray.join(', ')}`
                }
            );

            // Log for each subreddit
            for (let i = 0; i < subredditArray.length; i++) {
                const subreddit = subredditArray[i];
                const postsFromThisSub = Math.min(postsPerSubreddit, response.data.scraped - i * postsPerSubreddit);

                if (postsFromThisSub > 0) {
                    addLog(
                        `${postsFromThisSub} posts from r/${subreddit}`,
                        'info',
                        {
                            service: 'Reddit',
                            operation: 'subreddit_complete',
                            level: 2,
                            postData: {
                                subreddit: subreddit
                            },
                            details: `Successfully scraped ${postsFromThisSub} posts from r/${subreddit}`
                        }
                    );
                }
            }

            // Log storage results
            addLog(`${response.data.stored} posts stored in database`, 'info', {
                service: 'Database',
                operation: 'store',
                level: 1,
                details: `Successfully stored: ${response.data.stored}\nDuplicates skipped: ${response.data.scraped - response.data.stored}\nStorage efficiency: ${Math.round((response.data.stored / response.data.scraped) * 100)}%`
            });

            // Log analysis results
            addLog(`${response.data.analyzed} posts analyzed with Gemini AI`, 'info', {
                service: 'Gemini',
                operation: 'analyze',
                level: 1,
                details: `Analysis type: sentiment, summary, keywords\nModel: Gemini 2.5 Flash\nAnalyzed: ${response.data.analyzed}\nAnalysis rate: ${Math.round((response.data.analyzed / scrapeDuration) * 1000)} posts/sec`
            });

            // Log storage errors if any
            if (response.data.storageErrors && response.data.storageErrors.length > 0) {
                addLog(
                    `${response.data.storageErrors.length} storage errors occurred`,
                    'warning',
                    {
                        service: 'Database',
                        operation: 'error_report',
                        details: response.data.storageErrors
                            .map(e => `- ${e.post_id}: ${e.error}`)
                            .join('\n')
                    }
                );
            }

            addLog('Processing results...', 'debug', {
                service: 'Server',
                operation: 'process_results'
            });

            setResult(response.data);
            setCurrentProcessing({
                subreddit: 'Complete',
                postCount: response.data.stored,
                totalPosts: response.data.scraped
            });

            // ========== START: SAVE TO LOCALSTORAGE ==========
            // Fetch posts from API and save to localStorage
            try {
                addLog('Saving posts to local storage...', 'info', {
                    service: 'Local Storage',
                    operation: 'save_start',
                    level: 1
                });

                const postsResponse = await axios.get<any>('/api/posts');
                const postsData = postsResponse.data?.data || [];

                if (Array.isArray(postsData) && postsData.length > 0) {
                    // Get existing posts from localStorage
                    const existingPosts = localStorageService.getPosts();

                    // Merge with new posts (avoid duplicates)
                    const mergedPosts = [
                        ...existingPosts.filter(ep => !postsData.some(np => np.post_id === ep.post_id)),
                        ...postsData
                    ];

                    // Save to localStorage
                    localStorageService.savePosts(mergedPosts);

                    addLog(`✓ ${postsData.length} posts saved to local storage`, 'success', {
                        service: 'Local Storage',
                        operation: 'save_complete',
                        level: 1,
                        details: `Total posts available: ${mergedPosts.length}`
                    });
                }
            } catch (err) {
                addLog('Failed to save posts to local storage', 'warning', {
                    service: 'Local Storage',
                    operation: 'save_failed',
                    details: err instanceof Error ? err.message : String(err)
                });
            }
            // ========== END: SAVE TO LOCALSTORAGE ==========

            const totalDuration = Date.now() - startTime;

            if (response.data.success) {
                addLog(
                    `🎉 Process completed successfully!`,
                    'success',
                    {
                        service: 'Server',
                        operation: 'scrape_complete',
                        duration: totalDuration,
                        details: `Total time: ${totalDuration}ms\nThroughput: ${response.data.scraped > 0 ? Math.round((response.data.scraped / totalDuration) * 1000) : 0} posts/sec\nAverage per post: ${Math.round(totalDuration / (response.data.scraped || 1))}ms\n\nFinal Stats:\n- Scraped: ${response.data.scraped}\n- Stored: ${response.data.stored}\n- Analyzed: ${response.data.analyzed}\n- From ${subredditArray.length} subreddits`
                    }
                );
                onSuccess();
            } else {
                addLog('Process completed with issues', 'warning', {
                    service: 'Server',
                    operation: 'scrape_complete_with_issues',
                    duration: totalDuration
                });
            }
        } catch (err) {
            let errorMsg = 'An unknown error occurred';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.message;
            }
            addLog(`Error: ${errorMsg}`, 'error', {
                service: 'Server',
                operation: 'error',
                details: err instanceof Error ? err.stack : String(err)
            });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '1.5rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div
                        style={{
                            background: '#dbeafe',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            marginRight: '0.75rem'
                        }}
                    >
                        <svg
                            style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                            Scrape Reddit Posts
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Fetch data from Reddit and store locally
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '0.25rem'
                            }}
                        >
                            Subreddits (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={subreddits}
                            onChange={(e) => setSubreddits(e.target.value)}
                            disabled={loading || clearing}
                            placeholder="socialmedia,marketing,digitalmarketing"
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '0.25rem'
                            }}
                        >
                            Posts per subreddit
                        </label>
                        <input
                            type="number"
                            value={postsPerSubreddit}
                            onChange={(e) => setPostsPerSubreddit(Number(e.target.value))}
                            disabled={loading || clearing}
                            min="1"
                            max="50"
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div
                        style={{
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '0.5rem'
                        }}
                    >
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#92400e',
                                cursor: 'pointer'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={clearBeforeScrape}
                                onChange={(e) => setClearBeforeScrape(e.target.checked)}
                                disabled={loading || clearing}
                                style={{
                                    marginRight: '0.5rem',
                                    width: '1rem',
                                    height: '1rem',
                                    cursor: 'pointer'
                                }}
                            />
                            Clear old data before scraping new subreddits
                        </label>
                        <p
                            style={{
                                fontSize: '0.75rem',
                                color: '#78350f',
                                marginTop: '0.25rem',
                                marginLeft: '1.5rem'
                            }}
                        >
                            Recommended: This will delete all previous posts to show only new results
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button
                        onClick={handleScrape}
                        disabled={loading || clearing}
                        style={{
                            flex: 1,
                            background: loading ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            fontWeight: '600',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: loading || clearing ? 'not-allowed' : 'pointer',
                            fontSize: '1rem'
                        }}
                        onMouseEnter={(e) => !loading && !clearing && (e.currentTarget.style.background = '#1d4ed8')}
                        onMouseLeave={(e) => !loading && !clearing && (e.currentTarget.style.background = '#2563eb')}
                    >
                        {loading ? 'Scraping... This may take a few minutes' : 'Start Scraping'}
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
                            fontSize: '1rem',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => !loading && !clearing && (e.currentTarget.style.background = '#b91c1c')}
                        onMouseLeave={(e) => !loading && !clearing && (e.currentTarget.style.background = '#dc2626')}
                        title="Clear all posts from local storage"
                    >
                        {clearing ? 'Clearing...' : '🗑️ Clear All'}
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '0.5rem'
                        }}
                    >
                        <p style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                            Error: {error}
                        </p>
                    </div>
                )}

                {result && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: result.success ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '0.5rem'
                        }}
                    >
                        <h3
                            style={{
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: result.success ? '#166534' : '#991b1b',
                                margin: 0
                            }}
                        >
                            {result.message}
                        </h3>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '1rem',
                                fontSize: '0.875rem',
                                marginTop: '1rem'
                            }}
                        >
                            <div>
                                <span style={{ color: '#4b5563' }}>Scraped:</span>
                                <span style={{ fontWeight: 'bold', marginLeft: '0.5rem' }}>{result.scraped}</span>
                            </div>
                            <div>
                                <span style={{ color: '#4b5563' }}>Stored:</span>
                                <span style={{ fontWeight: 'bold', marginLeft: '0.5rem' }}>{result.stored}</span>
                            </div>
                            <div>
                                <span style={{ color: '#4b5563' }}>Analyzed:</span>
                                <span style={{ fontWeight: 'bold', marginLeft: '0.5rem' }}>{result.analyzed}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Process Logger with dynamic subreddit and post display */}
            <ProcessLogger
                logs={processLogs}
                isVisible={showLogs}
                currentProcessing={currentProcessing}
            />
        </>
    );
};

export default DataFetcher;