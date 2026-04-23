import React from "react";
import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

export const metadata: Metadata = {
    title: "Reddit Scraper & AI Analyzer",
    description: "Free Reddit analytics tool with AI sentiment analysis",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        {children}
        <Analytics />
        </body>
        </html>
    );
}