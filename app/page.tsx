"use client";

import axios from 'axios';
import { HealthResponse } from "../components/types";
import React, { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import DataFetcher from "../components/DataFetcher";
import ResultBox from "../components/ResultBox";
import Footer from "../components/Footer";
import ProcessLogger, { ProcessLog } from "../components/ProcessLogger";

// ─── SEO Data ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
    { q: "What is the Reddit Analytics Platform?", a: "It's a free hobby web app that scrapes posts from any public subreddit using Reddit's public JSON API (no login required), analyzes them with Google Gemini AI, and stores everything in your browser's localStorage — so your data is private, isolated, and persists even after a page refresh." },
    { q: "How does the Reddit sentiment analysis work?", a: "After scraping, each post's title and content is sent to Google Gemini AI (free tier). Gemini extracts the sentiment (positive, neutral, or negative), generates a plain-English summary, and pulls out the top keywords. Results are saved back to localStorage and appear live in the results panel, which auto-refreshes every 3 seconds." },
    { q: "Where is my scraped data stored?", a: "All data is stored exclusively in your browser's localStorage — not on any server. Each browser session (or incognito window) gets its own completely isolated dataset. Your posts will never interfere with another user's data, and clearing your data only affects your own session." },
    { q: "Which subreddits can I scrape and analyze?", a: "Any public subreddit. You enter subreddit names as a comma-separated list (e.g. socialmedia, marketing, digital_marketing). You can scrape up to 50 posts per subreddit. Popular choices include r/marketing, r/SocialMediaMarketing, r/entrepreneur, r/startups, and r/ecommerce." },
    { q: "Does this app require a Reddit account or API key?", a: "No Reddit account or API key is needed. The app uses Reddit's public JSON API endpoint which is freely accessible without authentication. All you need is a Google Gemini API key for the AI analysis step." },
    { q: "Is the Reddit scraper tool free to use?", a: "Yes, completely free. The app is hosted on Vercel and uses Google Gemini AI on the free tier, which is rate-limited to 30 requests per minute. There's no paywall, no sign-up, and no usage fees." },
    { q: "What can I use Reddit post analysis for?", a: "Great use cases include: SEO keyword research (find real questions your audience is asking), content gap analysis, brand monitoring, competitor research, social listening, and identifying trending discussions in your niche." },
    { q: "How do I clear my scraped data?", a: "Click the red 'Clear All' button in the scraper panel. This removes all posts from your browser's localStorage. You can also enable 'Clear old data before scraping' to automatically wipe previous results before each new scrape session." },
    { q: "Can multiple people use the app at the same time?", a: "Yes. Because data is stored in each user's own browser localStorage rather than a shared server database, there are zero conflicts between users. Each person's session is completely independent." },
];

const FEATURES = [
    { icon: "", title: "Reddit Public API Scraping", desc: "Fetches posts directly from Reddit's public JSON API — no authentication, no API key, no rate-limit issues on the scraping side." },
    { icon: "", title: "Google Gemini AI Analysis", desc: "Every scraped post is analyzed by Gemini AI for sentiment classification, keyword extraction, and a concise plain-English summary." },
    { icon: "", title: "100% Private — Browser localStorage", desc: "Your data never touches a shared server. Everything is stored in your own browser's localStorage. Completely isolated, even from other users on the same app." },
    { icon: "", title: "Live Filterable Results", desc: "Filter analyzed posts by Positive, Neutral, or Negative sentiment. Results auto-refresh every 3 seconds as new posts finish analysis." },
    { icon: "", title: "Real-Time Process Logger", desc: "Watch every step of the pipeline live — scrape, store, analyze. Each action is logged with timestamps so you know exactly what's happening." },
    { icon: "️", title: "Multi-Subreddit in One Run", desc: "Enter multiple subreddits at once (comma-separated). Scrape up to 50 posts per subreddit in a single session with full AI analysis on all of them." },
];

const HOW_IT_WORKS = [
    { step: "01", title: "Enter Subreddits", desc: "Type any public subreddit names separated by commas. Set how many posts per subreddit you want (up to 50). Choose whether to clear old data first." },
    { step: "02", title: "Scrape Reddit Posts", desc: "The app hits Reddit's public JSON API to fetch the latest posts. No login or API key needed. Progress is shown live in the Process Log panel." },
    { step: "03", title: "Gemini AI Analysis", desc: "Each post's title and content is sent to Google Gemini AI. It returns the sentiment, a summary, and keywords. Rate-limited to 30 req/min on the free tier." },
    { step: "04", title: "View & Filter Results", desc: "Analyzed posts appear on the right panel, filterable by All / Positive / Neutral / Negative. Results auto-refresh every 3 seconds as analysis completes." },
];

// ─── SEO Section ─────────────────────────────────────────────────────────────
const SEOSection: React.FC = () => {
    const [openFaq, setOpenFaq] = React.useState<number | null>(null);

    return (
        <section aria-label="About this Reddit analytics tool, features, how it works, and FAQ">

            {/* Intro */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '4rem 1.5rem 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.25', letterSpacing: '-0.02em' }}>
                        Free Reddit Scraper &amp; AI Sentiment Analyzer
                    </h2>
                    <p style={{ maxWidth: '760px', margin: '0 auto 1rem', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8' }}>
                        A privacy-first Reddit analytics tool built with <strong>Next.js</strong>,{' '}
                        <strong>Google Gemini AI</strong>, and browser <strong>localStorage</strong>.
                        Scrape any public subreddit in seconds, get AI-powered sentiment scores,
                        keyword clusters, and plain-English summaries — all stored locally in your
                        browser with zero server-side data retention.
                    </p>
                    <p style={{ maxWidth: '760px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: '1.75' }}>
                        Built as a <strong>hobby project</strong> to explore social listening, Reddit content research, and AI text classification pipelines.
                        Ideal for <strong>SEO professionals</strong>, <strong>digital marketers</strong>, and <strong>content strategists</strong>.
                    </p>
                </div>
            </div>

            {/* How it works */}
            <div style={{ padding: '4rem 1.5rem 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center', letterSpacing: '-0.01em' }}>
                        How It Works — End-to-End Pipeline
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        border: '1px solid var(--border)',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                    }}>
                        {HOW_IT_WORKS.map((item, i) => (
                            <div key={i} style={{
                                padding: '1.75rem',
                                borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid var(--border)' : 'none',
                                background: i % 2 === 0 ? 'var(--bg-card-alt)' : 'var(--bg-card)',
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--border)', lineHeight: '1', marginBottom: '0.75rem' }}>
                                    {item.step}
                                </div>
                                <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    {item.title}
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0 }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feature grid */}
            <div style={{ padding: '4rem 1.5rem 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center', letterSpacing: '-0.01em' }}>
                        Platform Features
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {FEATURES.map((f, i) => (
                            <article key={i} style={{
                                background: 'var(--bg-card-alt)',
                                border: '1px solid var(--border)',
                                borderRadius: '0.75rem',
                                padding: '1.5rem',
                            }}>
                                <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                                <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                                    {f.title}
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0 }}>
                                    {f.desc}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>

            {/* Who is this for — always dark gradient, no change needed */}
            <div style={{ padding: '4rem 1.5rem 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderRadius: '1rem', padding: '2.5rem 2rem', color: 'white' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f1f5f9', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
                            Who Should Use This Tool?
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1.75rem', maxWidth: '640px' }}>
                            Reddit is one of the most honest sources of unfiltered audience opinion on the internet. This tool makes that data instantly accessible and AI-readable.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {[
                                { role: "SEO Specialists", use: "Extract real long-tail keywords and questions your audience is already typing into Google." },
                                { role: "Digital Marketers", use: "Monitor brand mentions, track competitor sentiment, and spot trends before they peak." },
                                { role: "Content Strategists", use: "Find content gaps and understand which topics drive the most engagement in your niche." },
                                { role: "Product Managers", use: "Discover raw user feedback, pain points, and feature requests from niche communities." },
                                { role: "Researchers", use: "Collect and classify social media text data at scale without scraping infrastructure." },
                                { role: "Indie Hackers", use: "Validate ideas by analyzing community sentiment around problems before you build." },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    borderRadius: '0.625rem',
                                    padding: '1rem 1.125rem',
                                    border: '1px solid rgba(255,255,255,0.09)'
                                }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: '#7dd3fc', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {item.role}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.55' }}>
                                        {item.use}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tech stack */}
            <div style={{ padding: '4rem 1.5rem 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '-0.01em' }}>
                        Built With
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                        {[
                            { label: "Next.js 14 (App Router)", color: "#94a3b8" },
                            { label: "TypeScript",              color: "#3178c6" },
                            { label: "Google Gemini AI",        color: "#4285f4" },
                            { label: "Reddit Public JSON API",  color: "#ff4500" },
                            { label: "Browser localStorage",    color: "#16a34a" },
                            { label: "Vercel",                  color: "#94a3b8" },
                            { label: "Tailwind CSS",            color: "#0ea5e9" },
                        ].map((t, i) => (
                            <span key={i} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                background: 'var(--bg-card-alt)',
                                border: '1px solid var(--border)',
                                borderRadius: '9999px',
                                padding: '0.4rem 1rem',
                                fontSize: '0.8125rem', fontWeight: '600',
                                color: 'var(--text-secondary)'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                                {t.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ */}
            {/* FAQ */}
            <div style={{ padding: '4rem 1.5rem 0' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.01em' }}>
                        Frequently Asked Questions
                    </h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                        Everything you need to know about the Reddit scraper and AI analysis pipeline.
                    </p>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                        {FAQ_ITEMS.map((item, i) => (
                            <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    aria-expanded={openFaq === i}
                                    style={{
                                        width: '100%', textAlign: 'left',
                                        background: openFaq === i ? 'var(--bg-card-alt)' : 'var(--bg-card)',
                                        border: 'none',
                                        padding: '1.125rem 1.5rem',
                                        cursor: 'pointer',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                                    }}
                                >
                        <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                            {item.q}
                        </span>
                                    <span style={{
                                        fontSize: '1.25rem', color: 'var(--text-link)', flexShrink: 0, fontWeight: '300',
                                        display: 'inline-block', lineHeight: '1',
                                        transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                    }}>+</span>
                                </button>
                                {openFaq === i && (
                                    <div style={{ padding: '0 1.5rem 1.25rem', background: 'var(--bg-card-alt)' }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.8', margin: 0 }}>
                                            {item.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Creator Section */}
            <div style={{ padding: '4rem 1.5rem 0' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center', letterSpacing: '-0.01em' }}>
                        About the Creator
                    </h2>
                    <div style={{
                        background: 'var(--bg-card-alt)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        padding: '2rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                                Lean Paninsoro
                            </h3>
                            <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', margin: 0 }}>
                                Full-Stack Developer
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: '📧 Email', value: 'paninsorolean@gmail.com', href: 'mailto:paninsorolean@gmail.com' },
                                { label: '🔗 GitHub', value: 'github.com/Leyaaaan1', href: 'https://github.com/Leyaaaan1' },
                                { label: '💼 Portfolio', value: 'portfolio-leyan-ifux.vercel.app', href: 'https://portfolio-leyan-ifux.vercel.app/' },
                                { label: '📦 Repository', value: 'reddit-sentiment-analyzer', href: 'https://github.com/Leyaaaan1/reddit-something' },
                            ].map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                                    rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.5rem',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-card-alt)';
                                        e.currentTarget.style.borderColor = 'var(--text-link)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-card)';
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-link)' }}>
                                        {item.value}
                                    </div>
                                </a>
                            ))}
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
                            Built with passion and curiosity. This project combines Reddit's public API, Google Gemini AI, and modern web technologies to create a powerful sentiment analysis tool. Open source and always evolving.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div style={{ padding: '4rem 1.5rem 4rem' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '2.5rem',
                        background: 'var(--banner-bg)',
                        borderRadius: '1rem',
                        border: '1px solid var(--banner-border)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--banner-title)', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
                            Start Analyzing Reddit Posts in Seconds — No Sign-Up Required
                        </h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--banner-text)', margin: '0 auto', maxWidth: '560px', lineHeight: '1.7' }}>
                            Enter your subreddits above, set your post limit, and hit <strong>Start Scraping</strong>.
                            Google Gemini AI will classify every post in real time. Your data stays private in your browser — always.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState<HealthResponse['statistics'] | null>(null);
    const [healthLoading, setHealthLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [darkMode, setDarkMode] = useState(true); // DEFAULT TO DARK MODE
    const [logs, setLogs] = useState<ProcessLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);

    // Apply theme to <html>
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Persist preference
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            setDarkMode(false);
        } else {
            setDarkMode(true); // DEFAULT TO DARK
        }
    }, []);

    const toggleDark = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            return next;
        });
    };

    useEffect(() => {
        fetchHealthStatus();
    }, [refreshKey]);

    const fetchHealthStatus = async () => {
        setHealthLoading(true);
        try {
            const response = await axios.get<HealthResponse>('/api/health');
            if (response.data.status === 'healthy') {
                setHealthStatus(response.data.statistics);
            }
        } catch {
            // silently fail
        } finally {
            setHealthLoading(false);
        }
    };

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
            <Header
                status={healthStatus}
                loading={healthLoading}
                darkMode={darkMode}
                onToggleDark={toggleDark}
            />

            <main style={{ flexGrow: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Info banner */}
                <div style={{
                    background: 'var(--banner-bg)',
                    border: '1px solid var(--banner-border)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <svg style={{ width: '1.125rem', height: '1.125rem', color: '#2563eb', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--banner-title)', marginBottom: '0.2rem' }}>
                                How it works
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--banner-text)', lineHeight: '1.5', margin: 0 }}>
                                <strong>Step 1:</strong> Scrape posts from Reddit on the left.{' '}
                                <strong>Step 2:</strong> Posts are analyzed with Gemini AI.{' '}
                                <strong>Step 3:</strong> View results in the center!
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Main three-column grid ── */}
                {/*
                    Left column   → DataFetcher (controls)
                    Center column → ResultBox (posts)
                    Right column  → ProcessLogger (logs) - small area
                    The grid collapses to single column below ~1200px via a responsive style tag.
                */}
                <style>{`
                    .main-grid {
                        display: grid;
                        grid-template-columns: 320px 1fr ;
                        gap: 1.25rem;
                        align-items: start;
                        height: 700px;
                    }
                    @media (max-width: 900) {
                        .main-grid {
                            grid-template-columns: 1fr;
                            height: auto;
                        }
                    }
                    .left-col {
                        display: flex;
                        flex-direction: column;
                        gap: 1.25rem;
                        height: 100%;
                        overflow-y: auto;
                    }
                    .center-col {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        overflow: hidden;
                    }
                 
                    .card {
                        background: var(--bg-card);
                        border-radius: 0.75rem;
                        border: 1px solid var(--border);
                        box-shadow: var(--shadow);
                    }
                `}</style>

                <div className="main-grid">
                    {/* Left: controls */}
                    <div className="left-col">
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <DataFetcher onSuccess={handleRefresh} />
                        </div>
                    </div>

                    {/* Center: results */}
                    <div className="center-col">
                        <ResultBox key={refreshKey} />
                    </div>

                </div>
            </main>

            <SEOSection />
            <Footer />
        </div>
    );
};

export default App;