import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Reddit Scraper & Analyzer',
    description: 'Scrape Reddit posts and analyze them with Gemini AI',
    keywords: ['reddit', 'scraper', 'analyzer', 'sentiment analysis', 'AI'],
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body>
            {children}
            <Analytics />
        </body>
        </html>
    )
}