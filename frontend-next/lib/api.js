const API_BASE_URL = '/api/v1';

class ApiService {
    constructor() {
        this.token = typeof window !== 'undefined' ? localStorage.getItem('fin_intel_token') : null;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            if (response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('fin_intel_token');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                throw new Error('Session expired');
            }

            // Handle 204 No Content
            if (response.status === 204) return null;

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Request failed');
            return data;
        } catch (error) {
            console.error(`API Error for ${url}:`, error);
            throw error;
        }
    }

    async login(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (!response.ok) throw new Error('Login failed');
        const data = await response.json();
        this.token = data.access_token;
        localStorage.setItem('fin_intel_token', this.token);
        return data;
    }

    // === Companies (read for all, write for admin) ===
    async getCompanies() { return this.request('/companies'); }
    async getCompany(id) { return this.request(`/companies/${id}`); }

    async createCompany(data) {
        return this.request('/companies', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCompany(id, data) {
        return this.request(`/companies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCompany(id) {
        return this.request(`/companies/${id}`, {
            method: 'DELETE'
        });
    }

    async uploadCompanyExcel(formData) {
        const url = `${API_BASE_URL}/companies/upload-excel`;
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Ensure we don't accidentally send global headers with application/json
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('fin_intel_token');
                window.location.href = '/login';
            }
            throw new Error('Session expired');
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Upload failed');
        return data;
    }

    async connectCompanyApi(config) {
        return this.request('/companies/connect-api', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    // === Users (admin only) ===
    async getUserMe() { return this.request('/users/me'); }
    async updateProfile(data) {
        return this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getUsers() { return this.request('/users'); }

    async createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // === Chat ===
    async sendMessage(sessionId, message, companyId) {
        return this.sendChatMessage(message, sessionId, companyId);
    }

    async sendChatMessage(message, sessionId = null, companyId = null) {
        return this.request('/chat/message', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                company_id: companyId,
                message: message
            })
        });
    }

    // === Analysis ===
    async compareCompanies(companyIds) {
        return this.request('/analysis/compare', {
            method: 'POST',
            body: JSON.stringify({ company_ids: companyIds })
        });
    }

    // === Registration (public + admin) ===
    async submitRegistration(formData) {
        // Public endpoint — no auth token needed, uses FormData (multipart)
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            body: formData, // FormData — browser sets Content-Type automatically
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Registration failed');
        return data;
    }

    async getRegistrations(statusFilter) {
        const query = statusFilter ? `?status_filter=${statusFilter}` : '';
        return this.request(`/registrations${query}`);
    }

    async approveRegistration(id, notes = '') {
        return this.request(`/registrations/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ admin_notes: notes }),
        });
    }

    async rejectRegistration(id, notes = '') {
        return this.request(`/registrations/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ admin_notes: notes }),
        });
    }

    async resendRegistrationEmail(id) {
        return this.request(`/registrations/${id}/resend-email`, {
            method: 'POST'
        });
    }

    async uploadFile(formData) {
        const url = `${API_BASE_URL}/upload/`;
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('fin_intel_token');
                window.location.href = '/login';
            }
            throw new Error('Session expired');
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Upload failed');
        return data;
    }
}

export const api = new ApiService();
