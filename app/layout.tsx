import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Free Reddit Scraper & AI Sentiment Analyzer | RedditAnalytics",
    description:
        "Scrape any public subreddit and analyze posts with Google Gemini AI. Get sentiment scores, keyword clusters, and summaries — free, private, no login required.",
    keywords: [
        "reddit scraper",
        "reddit sentiment analysis",
        "reddit analytics tool",
        "subreddit analyzer",
        "AI sentiment analysis",
        "google gemini reddit",
        "reddit keyword research",
        "social listening tool",
        "free reddit tool",
    ],
    authors: [{ name: "Lean Paninsoro" }],
    robots: { index: true, follow: true },
    alternates: {
        canonical: "https://reddit-something.vercel.app/",
    },
    openGraph: {
        type: "website",
        url: "https://reddit-something.vercel.app/",
        title: "Free Reddit Scraper & AI Sentiment Analyzer",
        description:
            "Scrape any public subreddit and get AI-powered sentiment analysis, keyword extraction, and summaries. 100% free, no login needed.",
        siteName: "Reddit AI Analyzer",
        images: [
            {
                url: "https://reddit-something.vercel.app/og-image.png",
                width: 1200,
                height: 630,
                alt: "Reddit Scraper & AI Analyzer",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Free Reddit Scraper & AI Sentiment Analyzer",
        description:
            "Analyze any subreddit with Google Gemini AI. Sentiment scores, keywords & summaries — free & private.",
        images: ["https://reddit-something.vercel.app/og-image.png"],
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head>
            {/* Structured Data — WebApplication */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Reddit Scraper & AI Sentiment Analyzer",
                        url: "https://reddit-something.vercel.app/",
                        description:
                            "Scrape public subreddits and analyze posts with Google Gemini AI for sentiment, keywords, and summaries.",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "Web",
                        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                    }),
                }}
            />
        </head>
        <body>{children}</body>
        </html>
    );
}