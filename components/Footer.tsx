// src/components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer style={{ background: 'var(--footer-bg)', color: 'white', marginTop: '3rem' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', margin: 0 }}>Reddit Scraper &amp; Analyzer Dashboard</p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                            Powered by Reddit and Gemini AI
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{
                                height: '0.5rem', width: '0.5rem',
                                background: '#4ade80', borderRadius: '50%'
                            }} />
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Online</span>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>v1.0.0</span>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid #374151', marginTop: '1rem', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                        © {new Date().getFullYear()} Reddit Analyzer. Built with React + TypeScript + Tailwind CSS
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;