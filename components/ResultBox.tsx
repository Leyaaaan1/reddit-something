// src/components/ResultBox.tsx
import React, { useState, useEffect } from 'react';
import { RedditPost } from './types';
import { localStorageService } from '../lib/utils/LocalStorage';

const ResultBox: React.FC = () => {
    const [posts, setPosts]   = useState<RedditPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(() => fetchPosts(true), 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchPosts = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const postsData = localStorageService.getPosts();
            setPosts(Array.isArray(postsData) ? postsData : []);
        } catch {
            setError('Failed to fetch posts from local storage');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'all') return true;
        if (!post.analysis) return false;
        return post.analysis.sentiment === filter;
    });

    const getSentimentStyle = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' };
            case 'negative': return { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' };
            default:         return { color: 'var(--text-secondary)', background: 'var(--bg-card-alt)', border: '1px solid var(--border)' };
        }
    };

    const FILTERS = ['all', 'positive', 'neutral', 'negative'] as const;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            {/* Header row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: '#d1fae5',
                        padding: '0.4rem',
                        borderRadius: '0.5rem',
                        position: 'relative'
                    }}>
                        <svg style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span style={{
                            position: 'absolute', top: '0.2rem', right: '0.2rem',
                            width: '0.4rem', height: '0.4rem',
                            background: '#10b981', borderRadius: '50%',
                            animation: 'pulse 2s ease-in-out infinite'
                        }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                            Analysis Results{' '}
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'normal' }}>● Live</span>
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                            Auto-updating every 3 seconds
                        </p>
                    </div>
                </div>

                {/* Filter buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '0.375rem 0.875rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.8125rem',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                background: filter === f ? '#2563eb' : 'var(--bg-card-alt)',
                                color: filter === f ? 'white' : 'var(--text-secondary)',
                                transition: 'background 0.15s, color 0.15s'
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content area */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {loading ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '3rem 0', color: 'var(--text-muted)'
                    }}>
                        <div style={{
                            width: '2.5rem', height: '2.5rem',
                            border: '3px solid var(--border)',
                            borderTopColor: '#2563eb',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '0.75rem'
                        }} />
                        <p style={{ margin: 0 }}>Loading posts…</p>
                    </div>
                ) : error ? (
                    <div style={{
                        padding: '1rem', background: '#fef2f2',
                        border: '1px solid #fecaca', borderRadius: '0.5rem'
                    }}>
                        <p style={{ color: '#991b1b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>
                        <button onClick={() => fetchPosts()} style={{
                            fontSize: '0.875rem', color: '#dc2626', fontWeight: '500',
                            background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'
                        }}>Try again</button>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div style={{
                        padding: '3rem 1rem', color: 'var(--text-muted)',
                        textAlign: 'center', fontSize: '0.9rem'
                    }}>
                        No analyzed posts found. Start by scraping and analyzing some posts!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {filteredPosts.map(post => (
                            <div
                                key={post.post_id}
                                style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.625rem',
                                    padding: '1rem',
                                    background: 'var(--bg-card)',
                                    animation: 'fadeIn 0.4s ease'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                {/* Title + sentiment badge */}
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start',
                                    justifyContent: 'space-between', gap: '0.75rem',
                                    marginBottom: '0.4rem', flexWrap: 'wrap'
                                }}>
                                    <h3 style={{
                                        fontWeight: '600', color: 'var(--text-primary)',
                                        flex: 1, margin: 0, fontSize: '0.9375rem', lineHeight: '1.4'
                                    }}>
                                        {post.title}
                                    </h3>
                                    {post.analysis && (
                                        <span style={{
                                            ...getSentimentStyle(post.analysis.sentiment),
                                            padding: '0.2rem 0.625rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
                                        }}>
                                            {post.analysis.sentiment}
                                        </span>
                                    )}
                                </div>

                                {/* Meta row */}
                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    fontSize: '0.8rem', color: 'var(--text-muted)',
                                    marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem'
                                }}>
                                    <span>r/{post.source}</span>
                                    <span>·</span>
                                    <span>u/{post.author}</span>
                                    <span>·</span>
                                    <span>{post.score} pts</span>
                                    <span>·</span>
                                    <span>{post.num_comments} comments</span>
                                </div>

                                {/* Analysis block */}
                                {post.analysis && (
                                    <div style={{
                                        background: 'var(--bg-card-alt)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.5rem',
                                        padding: '0.75rem',
                                        marginBottom: '0.625rem'
                                    }}>
                                        <p style={{
                                            fontSize: '0.8125rem', color: 'var(--text-secondary)',
                                            marginBottom: '0.5rem', lineHeight: '1.6'
                                        }}>
                                            {post.analysis.summary}
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            {post.analysis.keywords.map((kw, idx) => (
                                                <span key={idx} style={{
                                                    padding: '0.2rem 0.5rem',
                                                    background: 'var(--tag-bg)',
                                                    color: 'var(--tag-text)',
                                                    fontSize: '0.7rem',
                                                    borderRadius: '0.25rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {kw}
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
                                        fontSize: '0.8125rem', color: 'var(--text-link)',
                                        textDecoration: 'none', fontWeight: '500'
                                    }}
                                >
                                    View on Reddit →
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer row */}
            <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)'
            }}>
                <span>Showing {filteredPosts.length} of {posts.length} posts</span>
                <button
                    onClick={() => fetchPosts()}
                    style={{
                        color: 'var(--text-link)', fontWeight: '500',
                        background: 'none', border: 'none', cursor: 'pointer'
                    }}
                >
                    ↻ Refresh
                </button>
            </div>
        </div>
    );
};

export default ResultBox;