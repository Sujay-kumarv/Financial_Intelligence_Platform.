"use client";
import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function RevenueChart({ trendData = null }) {
    const chartRef = useRef(null);

    const hasData = trendData && trendData.labels?.length > 0 && trendData.values?.length > 0;
    const labels = hasData ? trendData.labels : [];
    const values = hasData ? trendData.values : [];

    if (!hasData) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-sm font-bold text-white font-titles">Revenue Trend</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Monthly performance overview</p>
                    </div>
                </div>
                <div className="chart-container flex items-center justify-center">
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">No revenue data yet</p>
                        <p className="text-[10px] text-slate-600 mt-1">Upload financial statements to see trends</p>
                    </div>
                </div>
            </div>
        );
    }

    const data = {
        labels,
        datasets: [
            {
                label: 'Revenue ($M)',
                data: values,
                fill: true,
                borderColor: '#FFB300',
                borderWidth: 2,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
                    gradient.addColorStop(0, 'rgba(255, 179, 0, 0.25)');
                    gradient.addColorStop(0.5, 'rgba(255, 179, 0, 0.08)');
                    gradient.addColorStop(1, 'rgba(255, 179, 0, 0)');
                    return gradient;
                },
                pointBackgroundColor: '#FFB300',
                pointBorderColor: '#060E1F',
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#FFD369',
                pointHoverBorderColor: '#060E1F',
                pointHoverBorderWidth: 3,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(11, 26, 57, 0.9)',
                borderColor: 'rgba(255, 179, 0, 0.3)',
                borderWidth: 1,
                titleColor: '#FFB300',
                bodyColor: '#F5F7FA',
                titleFont: { family: 'Poppins', size: 12, weight: '600' },
                bodyFont: { family: 'Inter', size: 11 },
                padding: 12,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    label: (context) => `$${context.parsed.y.toFixed(1)}M`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)',
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    font: { family: 'Inter', size: 10, weight: '500' },
                    padding: 8,
                },
                border: { display: false },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)',
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    font: { family: 'Inter', size: 10, weight: '500' },
                    padding: 12,
                    callback: (value) => `$${value}M`,
                },
                border: { display: false },
            },
        },
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-bold text-white font-titles">Revenue Trend</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Monthly performance overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-glow" />
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Live</span>
                </div>
            </div>
            <div className="chart-container">
                <Line ref={chartRef} data={data} options={options} />
            </div>
        </div>
    );
}
