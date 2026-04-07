// src/components/ResultBox.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {RedditPost} from "./types";

const ResultBox: React.FC = () => {
    const [posts, setPosts] = useState<RedditPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

    useEffect(() => {
        // Initial fetch
        fetchPosts();

        // Set up polling every 3 seconds for real-time updates
        const interval = setInterval(() => {
            fetchPosts(true); // Silent fetch (no loading state)
        }, 3000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    const fetchPosts = async (silent: boolean = false) => {
        if (!silent) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await axios.get<{
                success: boolean;
                data: RedditPost[];
                pagination?: { page: number; limit: number; total: number };
            }>('/api/posts');


            // Handle both old format (direct array) and new format (with pagination)
            const postsData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);

            if (!Array.isArray(postsData)) {
                setPosts([]);
                return;
            }

            setPosts(postsData);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || err.message);
            } else {
                setError('Failed to fetch posts');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const filteredPosts = posts.filter(post => {
        // Show all posts, even without analysis
        if (filter === 'all') return true;

        // If filtering by sentiment, only show posts WITH analysis
        if (!post.analysis) return false;
        return post.analysis.sentiment === filter;
    });
    const getSentimentStyle = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' };
            case 'negative':
                return { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' };
            default:
                return { color: '#4b5563', background: '#f9fafb', border: '1px solid #e5e7eb' };
        }
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        background: '#d1fae5',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        marginRight: '0.75rem',
                        position: 'relative'
                    }}>
                        <svg style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {/* Live indicator */}
                        <span style={{
                            position: 'absolute',
                            top: '0.25rem',
                            right: '0.25rem',
                            width: '0.5rem',
                            height: '0.5rem',
                            background: '#10b981',
                            borderRadius: '50%',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}></span>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                            Analysis Results
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#10b981',
                                marginLeft: '0.5rem',
                                fontWeight: 'normal'
                            }}>● Live</span>
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Auto-updating every 3 seconds
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['all', 'positive', 'neutral', 'negative'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                background: filter === f ? '#2563eb' : '#f3f4f6',
                                color: filter === f ? 'white' : '#374151',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem 0',
                    color: '#4b5563'
                }}>
                    <div style={{
                        width: '3rem',
                        height: '3rem',
                        border: '3px solid #e5e7eb',
                        borderTopColor: '#2563eb',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '1rem'
                    }}></div>
                    <p>Loading posts...</p>
                </div>
            ) : error ? (
                <div style={{
                    padding: '1rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem'
                }}>
                    <p style={{ color: '#991b1b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>
                    <button
                        onClick={() => fetchPosts()}
                        style={{
                            fontSize: '0.875rem',
                            color: '#dc2626',
                            fontWeight: '500',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Try again
                    </button>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 0',
                    color: '#6b7280'
                }}>
                    <p>No analyzed posts found. Start by scraping and analyzing some posts!</p>
                </div>
            ) : (
                <div style={{
                    maxHeight: '24rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {filteredPosts.map((post) => (
                        <div key={post.post_id} style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            transition: 'all 0.3s ease',
                            animation: 'fadeIn 0.5s ease'
                        }}
                             onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                             onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem',
                                gap: '1rem',
                                flexWrap: 'wrap'
                            }}>
                                <h3 style={{
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    flex: 1,
                                    margin: 0
                                }}>
                                    {post.title}
                                </h3>
                                {post.analysis && (
                                    <span style={{
                                        ...getSentimentStyle(post.analysis.sentiment),
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {post.analysis.sentiment}
                                    </span>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                marginBottom: '0.75rem',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                            }}>
                                <span>r/{post.source}</span>
                                <span>•</span>
                                <span>by u/{post.author}</span>
                                <span>•</span>
                                <span>{post.score} points</span>
                                <span>•</span>
                                <span>{post.num_comments} comments</span>
                            </div>

                            {post.analysis && (
                                <div style={{
                                    background: '#f9fafb',
                                    borderRadius: '0.5rem',
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: '#374151',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {post.analysis.summary}
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem'
                                    }}>
                                        {post.analysis.keywords.map((keyword, idx) => (
                                            <span key={idx} style={{
                                                padding: '0.25rem 0.5rem',
                                                background: '#dbeafe',
                                                color: '#1e40af',
                                                fontSize: '0.75rem',
                                                borderRadius: '0.25rem'
                                            }}>
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <a
                                href={post.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: '0.875rem',
                                    color: '#2563eb',
                                    textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#1e40af'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                            >
                                View on Reddit →
                            </a>
                        </div>
                    ))}
                </div>
            )}

            <div style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#4b5563'
            }}>
                <span>Showing {filteredPosts.length} posts</span>
                <button
                    onClick={() => fetchPosts()}
                    style={{
                        color: '#2563eb',
                        fontWeight: '500',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1e40af'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                >
                    ↻ Refresh
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default ResultBox;