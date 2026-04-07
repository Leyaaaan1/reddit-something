"use client";

import axios from 'axios';
import {HealthResponse} from "../components/types";
import React, {useEffect, useState, useRef} from "react";
import Header from "../components/Header";
import DataFetcher from "../components/DataFetcher";
import ResultBox from "../components/ResultBox";
import Footer from "../components/Footer";
import ProcessLogger, { ProcessLog } from "../components/ProcessLogger";

const App: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState<HealthResponse['statistics'] | null>(null);
    const [healthLoading, setHealthLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);
    const processLoggerRef = useRef<any>(null);

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
        } catch (error) {
        } finally {
            setHealthLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f9fafb',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Header status={healthStatus} loading={healthLoading} />

            {/* Main Content Area - Full Height */}
            <main style={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                gap: '1.5rem'
            }}>
                {/* Info Banner */}
                <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <svg style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            color: '#2563eb',
                            marginTop: '0.125rem',
                            marginRight: '0.75rem',
                            flexShrink: 0
                        }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#1e3a8a',
                                marginBottom: '0.25rem'
                            }}>
                                How it works
                            </h3>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#1e40af',
                                lineHeight: '1.5'
                            }}>
                                <strong>Step 1:</strong> Scrape posts from Reddit. <strong style={{ marginLeft: '0.5rem' }}>Step 2:</strong> Posts are analyzed with Gemini AI. <strong style={{ marginLeft: '0.5rem' }}>Step 3:</strong> View results on the right!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Grid: Left Column (Input + Logs) | Right Column (Results) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.5fr',
                    gap: '1.5rem',
                    flexGrow: 1,
                    minHeight: 0, // Important for flex children
                }}>
                    {/* LEFT COLUMN */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        minHeight: 0,
                    }}>
                        {/* Upper Left: DataFetcher */}
                        <div style={{
                            background: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '1.5rem',
                            overflowY: 'auto'
                        }}>
                            <DataFetcher onSuccess={handleRefresh} />
                        </div>

                        {/* Lower Left: Process Logs */}
                        <div style={{
                            background: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '0',
                            overflowY: 'auto',
                            flex: 1,
                            minHeight: 0,
                        }}>
                            <ProcessLogger
                                logs={processLogs}
                                isVisible={true}
                                currentProcessing={{}}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Analysis Results */}
                    <div style={{
                        background: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        padding: '1.5rem',
                        overflowY: 'auto',
                        minHeight: 0,
                    }}>
                        <ResultBox key={refreshKey} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default App;