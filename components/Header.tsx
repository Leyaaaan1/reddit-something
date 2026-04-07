// src/components/Header.tsx
import React from 'react';

interface HeaderProps {
    status: {
        totalRecords: number;
        analyzedRecords: number;
        pendingAnalysis: number;
    } | null;
    loading: boolean;
}

const Header: React.FC<HeaderProps> = ({ status, loading }) => {
    return (
        <header style={{
            background: '#1a1a1a',
            color: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '1.5rem 1rem'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.875rem',
                            fontWeight: 'bold',
                            marginBottom: '0.25rem'
                        }}>
                            Reddit Scraper & Analyzer (I'm bored)
                        </h1>
                        <p style={{
                            color: '#bfdbfe',
                            fontSize: '0.875rem'
                        }}>
                            Reddit custom scrape → Gemini AI Pipeline
                        </p>
                    </div>

                    {loading ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <div style={{
                                width: '1rem',
                                height: '1rem',
                                border: '2px solid white',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <span style={{ fontSize: '0.875rem' }}>Loading stats...</span>
                        </div>
                    ) : status ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '0.5rem',
                            padding: '1rem'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {status.totalRecords}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>
                                    Total Posts
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {status.analyzedRecords}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>
                                    Analyzed
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {status.pendingAnalysis}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>
                                    Pending
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
};

export default Header;