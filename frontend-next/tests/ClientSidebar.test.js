import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ClientSidebar from '../components/ClientSidebar';
import { api } from '../lib/api';

// Mock API
jest.mock('../lib/api', () => ({
    api: {
        request: jest.fn(),
        getUserMe: jest.fn()
    }
}));

describe('ClientSidebar Component', () => {
    const mockClients = [
        { id: '1', name: 'Acme Corp', industry: 'Tech', status: 'Active' }
    ];

    beforeEach(() => {
        api.request.mockResolvedValue(mockClients);
        api.getUserMe.mockResolvedValue({ role: 'admin' });
    });

    test('hides Add Client button for analysts', async () => {
        api.getUserMe.mockResolvedValue({ role: 'analyst' });

        render(<ClientSidebar onSelect={() => { }} selectedIds={[]} onAddClient={() => { }} onCompare={() => { }} />);

        await waitFor(() => {
            expect(screen.queryByText('Add Client')).not.toBeInTheDocument();
            expect(screen.getByText('Compare')).toBeInTheDocument();
        });
    });

    test('shows Add Client button for admins', async () => {
        api.getUserMe.mockResolvedValue({ role: 'admin' });

        render(<ClientSidebar onSelect={() => { }} selectedIds={[]} onAddClient={() => { }} onCompare={() => { }} />);

        await waitFor(() => {
            expect(screen.getByText('Add Client')).toBeInTheDocument();
        });
    });
});
