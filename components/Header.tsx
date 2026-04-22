// src/components/Header.tsx
import React from 'react';

interface HeaderProps {
    status: {
        totalRecords: number;
        analyzedRecords: number;
        pendingAnalysis: number;
    } | null;
    loading: boolean;
    darkMode: boolean;
    onToggleDark: () => void;
}

const Header: React.FC<HeaderProps> = ({ status, loading, darkMode, onToggleDark }) => {
    return (
        <header style={{ background: 'var(--header-bg)', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    {/* Title block */}
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                            Reddit Scraper &amp; Analyzer
                        </h1>
                        <p style={{ color: '#93c5fd', fontSize: '0.8125rem' }}>
                            Reddit custom scrape → Gemini AI Pipeline
                        </p>
                    </div>

                    {/* Right side: stats + dark toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div style={{
                                    width: '1rem', height: '1rem',
                                    border: '2px solid white', borderTopColor: 'transparent',
                                    borderRadius: '50%', animation: 'spin 1s linear infinite'
                                }} />
                                Loading stats…
                            </div>
                        ) : status ? (
                            <div style={{
                                display: 'flex',
                                gap: '1.25rem',
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1.25rem'
                            }}>
                                {[
                                    { label: 'Total Posts', value: status.totalRecords },
                                    { label: 'Analyzed',   value: status.analyzedRecords },
                                    { label: 'Pending',    value: status.pendingAnalysis },
                                ].map((s, i) => (
                                    <div key={i} style={{
                                        textAlign: 'center',
                                        paddingLeft: i > 0 ? '1.25rem' : 0,
                                        borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#bfdbfe' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {/* Dark mode toggle */}
                        <button
                            onClick={onToggleDark}
                            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            style={{
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '1rem',
                                lineHeight: '1',
                                flexShrink: 0
                            }}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;