import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PortfolioOverview from '../components/PortfolioOverview';
import { api } from '../lib/api';

// Mock the API service
jest.mock('../lib/api', () => ({
    api: {
        request: jest.fn()
    }
}));

describe('PortfolioOverview Component', () => {
    const mockSummary = {
        total_clients: 5,
        total_revenue: 12500000,
        avg_health_score: 85,
        risk_distribution: { high: 1, medium: 2, low: 2 },
        ai_narrative: "Portfolio is performing well with strong growth."
    };

    beforeEach(() => {
        api.request.mockResolvedValue(mockSummary);
    });

    test('renders portfolio KPIs correctly', async () => {
        render(<PortfolioOverview />);

        await waitFor(() => {
            expect(screen.getByText('$12.5M')).toBeInTheDocument();
            // Use localized text or check for the specific KPI label context
            const clientCount = screen.getByText('5', { selector: 'h3' });
            expect(clientCount).toBeInTheDocument();
            expect(screen.getByText('85/100')).toBeInTheDocument();
        });
    });

    test('renders risk distribution bars', async () => {
        render(<PortfolioOverview />);

        await waitFor(() => {
            expect(screen.getByText('high Risk')).toBeInTheDocument();
            expect(screen.getByText('1 Entities')).toBeInTheDocument();
        });
    });

    test('displays AI narrative', async () => {
        render(<PortfolioOverview />);

        await waitFor(() => {
            expect(screen.getByText('Aggregate Performance & Strategy Alignment')).toBeInTheDocument();
            expect(screen.getByText('Portfolio is performing well with strong growth.')).toBeInTheDocument();
        });
    });
});
