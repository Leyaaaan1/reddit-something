import React, { useState } from 'react';

export interface ProcessLog {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'debug';
    level?: number;
    details?: string;
    service?: string;
    operation?: string;
    duration?: number;
    postData?: {
        title?: string;
        subreddit?: string;
        author?: string;
        score?: number;
        url?: string;
    };
}

interface ProcessLoggerProps {
    logs: ProcessLog[];
    isVisible: boolean;
    currentProcessing?: {
        subreddit?: string;
        postCount?: number;
        totalPosts?: number;
    };
}

const ProcessLogger: React.FC<ProcessLoggerProps> = ({ logs, isVisible, currentProcessing }) => {
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    const toggleExpanded = (logId: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(logId)) {
            newExpanded.delete(logId);
        } else {
            newExpanded.add(logId);
        }
        setExpandedLogs(newExpanded);
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'success':
                return '#16a34a';
            case 'error':
                return '#dc2626';
            case 'warning':
                return '#f59e0b';
            case 'debug':
                return '#8b5cf6';
            default:
                return '#2563eb';
        }
    };

    const getLogBackground = (type: string) => {
        switch (type) {
            case 'success':
                return '#f0fdf4';
            case 'error':
                return '#fef2f2';
            case 'warning':
                return '#fffbeb';
            case 'debug':
                return '#faf5ff';
            default:
                return '#eff6ff';
        }
    };

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'debug':
                return '🔧';
            default:
                return 'ℹ️';
        }
    };

    const getServiceColor = (service?: string) => {
        switch (service) {
            case 'Reddit':
                return '#FF4500';
            case 'Database':
                return '#336791';
            case 'Gemini':
                return '#4285F4';
            case 'Server':
                return '#2563eb';
            default:
                return '#6b7280';
        }
    };

    const logsByService = logs.reduce((acc, log) => {
        const service = log.service || 'General';
        if (!acc[service]) {
            acc[service] = [];
        }
        acc[service].push(log);
        return acc;
    }, {} as Record<string, ProcessLog[]>);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            style={{
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '1.5rem',
                marginTop: '1.5rem',
                border: '1px solid #e5e7eb'
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        📋 Process Log
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                        Real-time Reddit scraping progress
                    </p>
                </div>
            </div>

            {/* Current Processing Card */}
            {currentProcessing && (currentProcessing.subreddit || currentProcessing.postCount) && (
                <div
                    style={{
                        marginBottom: '1rem',
                        padding: '1rem',
                        background: '#f0f9ff',
                        border: '2px solid #0ea5e9',
                        borderRadius: '0.5rem'
                    }}
                >
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>
                        🔄 Currently Processing
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {currentProcessing.subreddit && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>
                                    SUBREDDIT
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.875rem',
                                        color: '#0369a1',
                                        fontWeight: '600',
                                        marginTop: '0.25rem',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    r/{currentProcessing.subreddit}
                                </div>
                            </div>
                        )}
                        {currentProcessing.postCount !== undefined && currentProcessing.totalPosts !== undefined && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>
                                    PROGRESS
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.875rem',
                                        color: '#0369a1',
                                        fontWeight: '600',
                                        marginTop: '0.25rem'
                                    }}
                                >
                                    {currentProcessing.postCount} / {currentProcessing.totalPosts}
                                </div>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '4px',
                                        background: '#e0f2fe',
                                        borderRadius: '2px',
                                        marginTop: '0.5rem',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            background: '#0ea5e9',
                                            width: `${Math.round((currentProcessing.postCount / currentProcessing.totalPosts) * 100)}%`,
                                            transition: 'width 0.3s ease'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Service Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {Object.keys(logsByService).map((service) => (
                    <div
                        key={service}
                        style={{
                            padding: '0.5rem 0.75rem',
                            background: '#f3f4f6',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderLeft: `3px solid ${getServiceColor(service)}`
                        }}
                    >
                        <span style={{ color: getServiceColor(service) }}>●</span> {service}
                        <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                            ({logsByService[service].length})
                        </span>
                    </div>
                ))}
            </div>

            {/* Logs Container */}
            <div
                style={{
                    background: '#1f2937',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#e5e7eb'
                }}
            >
                {logs.length === 0 ? (
                    <div style={{ color: '#9ca3af' }}>No logs yet...</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id}>
                            {/* Main Log Entry */}
                            <div
                                onClick={() => (log.details || log.postData) && toggleExpanded(log.id)}
                                style={{
                                    marginBottom: '0.75rem',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    background: getLogBackground(log.type),
                                    color: getLogColor(log.type),
                                    borderLeft: `3px solid ${getLogColor(log.type)}`,
                                    marginLeft: `${(log.level || 0) * 1.5}rem`,
                                    cursor: log.details || log.postData ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (log.details || log.postData) {
                                        e.currentTarget.style.opacity = '0.8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                            >
                                <span style={{ flexShrink: 0, marginTop: '0.125rem', fontSize: '1rem' }}>
                                    {getLogIcon(log.type)}
                                </span>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Timestamp and Service */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center',
                                            marginBottom: '0.25rem',
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                            {log.timestamp}
                                        </span>
                                        {log.service && (
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.125rem 0.375rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '0.25rem',
                                                    color: getServiceColor(log.service)
                                                }}
                                            >
                                                [{log.service}]
                                            </span>
                                        )}
                                        {log.operation && (
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.125rem 0.375rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '0.25rem',
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                {log.operation}
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Message */}
                                    <div style={{ marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                                        {log.message}
                                    </div>

                                    {/* Duration */}
                                    {log.duration && (
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                opacity: 0.8,
                                                marginTop: '0.25rem'
                                            }}
                                        >
                                            ⏱️ Duration: {log.duration}ms
                                        </div>
                                    )}

                                    {/* Expandable Details */}
                                    {(log.details || log.postData) && (
                                        <div
                                            style={{
                                                marginTop: '0.5rem',
                                                fontSize: '0.7rem',
                                                opacity: 0.8
                                            }}
                                        >
                                            {expandedLogs.has(log.id) ? '▼' : '▶'} Details
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {(log.details || log.postData) && expandedLogs.has(log.id) && (
                                <div
                                    style={{
                                        marginBottom: '0.5rem',
                                        marginLeft: `${((log.level || 0) + 0.5) * 1.5}rem`,
                                        padding: '0.75rem',
                                        background: '#111827',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #374151',
                                        fontSize: '0.75rem',
                                        color: '#d1d5db',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    {/* Post Data Section */}
                                    {log.postData && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <div style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                                POST DATA:
                                            </div>
                                            {log.postData.subreddit && (
                                                <div>📍 Subreddit: r/{log.postData.subreddit}</div>
                                            )}
                                            {log.postData.title && (
                                                <div>📝 Title: {log.postData.title}</div>
                                            )}
                                            {log.postData.author && (
                                                <div>👤 Author: u/{log.postData.author}</div>
                                            )}
                                            {log.postData.score !== undefined && (
                                                <div>⬆️ Score: {log.postData.score}</div>
                                            )}
                                            {log.postData.url && (
                                                <div>🔗 URL: {log.postData.url}</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Details Section */}
                                    {log.details && (
                                        <div>
                                            {log.postData && (
                                                <div style={{ borderTop: '1px solid #374151', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                                </div>
                                            )}
                                            {log.details}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Summary Footer */}
            {logs.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: '0.375rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                        Summary
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '0.75rem',
                            marginTop: '0.5rem',
                            fontSize: '0.875rem'
                        }}
                    >
                        <div>
                            <span style={{ color: '#6b7280' }}>Total Logs:</span>
                            <span style={{ fontWeight: 'bold', marginLeft: '0.5rem', color: '#374151' }}>
                                {logs.length}
                            </span>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280' }}>Success:</span>
                            <span
                                style={{
                                    fontWeight: 'bold',
                                    marginLeft: '0.5rem',
                                    color: '#16a34a'
                                }}
                            >
                                {logs.filter((l) => l.type === 'success').length}
                            </span>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280' }}>Errors:</span>
                            <span
                                style={{
                                    fontWeight: 'bold',
                                    marginLeft: '0.5rem',
                                    color: '#dc2626'
                                }}
                            >
                                {logs.filter((l) => l.type === 'error').length}
                            </span>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280' }}>Warnings:</span>
                            <span
                                style={{
                                    fontWeight: 'bold',
                                    marginLeft: '0.5rem',
                                    color: '#f59e0b'
                                }}
                            >
                                {logs.filter((l) => l.type === 'warning').length}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #374151;
                }
                ::-webkit-scrollbar-thumb {
                    background: #6b7280;
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </div>
    );
};

export default ProcessLogger;