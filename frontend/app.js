// ===== Configuration =====
const API_BASE_URL = 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'fin_intel_token';
const USER_KEY = 'fin_intel_user';
const COMPANY_KEY = 'fin_intel_company_ids';

// ===== State Management =====
const state = {
    token: null,
    user: null,
    selectedCompanyIds: [],
    companies: [],
    chatSession: null,
    attachedFiles: [],
    currentView: 'grid' // 'grid' or 'analysis'
};

// ===== Utility Functions =====
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const showLoading = () => document.getElementById('loading-overlay').classList.remove('hidden');
const hideLoading = () => document.getElementById('loading-overlay').classList.add('hidden');

const formatRatio = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return typeof value === 'number' ? value.toFixed(2) : value;
};

const formatRatioName = (key) => key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ===== API Client =====
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

        try {
            const response = await fetch(url, { ...options, headers });
            if (response.status === 401) { logout(); throw new Error('Session expired.'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Request failed');
            return data;
        } catch (error) { console.error('API Error:', error); throw error; }
    },

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
        return response.json();
    },

    async getCurrentUser() { return this.request('/users/me'); },
    async getCompanies() { return this.request('/companies/'); },
    async compareCompanies(companyIds) {
        return this.request('/analysis/compare', {
            method: 'POST',
            body: JSON.stringify({ company_ids: companyIds })
        });
    },
    async createChatSession(companyId) {
        return this.request('/chat/sessions', {
            method: 'POST',
            body: JSON.stringify({ company_id: companyId || 'multi' })
        });
    },
    async sendMessage(sessionId, message, companyId) {
        return this.request('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId, company_id: companyId, message: message })
        });
    }
};

// ===== Auth Logic =====
const logout = () => {
    state.token = null;
    localStorage.removeItem(TOKEN_KEY);
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
};

const checkAuth = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        state.token = token;
        try {
            state.user = await api.getCurrentUser();
            document.getElementById('user-name').textContent = state.user.full_name || state.user.email;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            await loadCompanies();
        } catch (e) { logout(); }
    }
};

// ===== AI-First UX Core =====

const loadCompanies = async () => {
    try {
        state.companies = await api.getCompanies();
        renderCompanyCards(state.companies);

        // Restore context
        const savedIds = JSON.parse(localStorage.getItem(COMPANY_KEY)) || [];
        if (savedIds.length > 0) {
            state.selectedCompanyIds = savedIds;
            updateActiveChips();
            if (savedIds.length > 1) runComparativeAnalysis();
        }
    } catch (error) { showToast(error.message, 'error'); }
};

const renderCompanyCards = (companies) => {
    const container = document.getElementById('company-cards-container');
    container.innerHTML = '';
    companies.forEach(company => {
        const isSelected = state.selectedCompanyIds.includes(company.id);
        const card = document.createElement('div');
        card.className = `company-card ${isSelected ? 'selected' : ''}`;
        card.dataset.id = company.id;

        // Random badge for demo
        const badge = Math.random() > 0.8 ? '<span class="card-status status-new">New Data</span>' : '';

        card.innerHTML = `
            <div class="card-header">
                <div class="card-icon">${company.name.substring(0, 2).toUpperCase()}</div>
                ${badge}
            </div>
            <div class="card-body">
                <h3>${company.name}</h3>
                <span class="card-ticker">${company.ticker_symbol || 'N/A'}</span>
                <div class="card-metrics">
                    <div class="mini-metric"><span>$${(Math.random() * 50).toFixed(1)}B</span>Revenue</div>
                    <div class="mini-metric"><span>${(Math.random() * 15).toFixed(1)}%</span>Profit</div>
                </div>
            </div>
        `;
        card.onclick = () => toggleCompanySelection(company.id);
        container.appendChild(card);
    });
};

const toggleCompanySelection = (id) => {
    if (state.selectedCompanyIds.includes(id)) {
        state.selectedCompanyIds = state.selectedCompanyIds.filter(cid => cid !== id);
    } else {
        state.selectedCompanyIds.push(id);
    }
    localStorage.setItem(COMPANY_KEY, JSON.stringify(state.selectedCompanyIds));
    updateActiveChips();
    renderCompanyCards(state.companies);

    if (state.selectedCompanyIds.length > 1) {
        runComparativeAnalysis();
    } else if (state.selectedCompanyIds.length === 0) {
        showGrid();
    }
};

const updateActiveChips = () => {
    const container = document.getElementById('active-company-chips');
    container.innerHTML = '';
    state.selectedCompanyIds.forEach(id => {
        const company = state.companies.find(c => c.id === id);
        if (company) {
            const chip = document.createElement('div');
            chip.className = 'company-chip';
            chip.innerHTML = `<span>${company.name}</span><button onclick="event.stopPropagation(); toggleCompanySelection('${id}')">&times;</button>`;
            container.appendChild(chip);
        }
    });
};

const showGrid = () => {
    document.getElementById('company-grid-section').classList.add('active');
    document.getElementById('chat-section').classList.remove('active');
    state.currentView = 'grid';
};

const showAnalysis = () => {
    document.getElementById('company-grid-section').classList.remove('active');
    document.getElementById('chat-section').classList.add('active');
    state.currentView = 'analysis';
};

// ===== Comparative Analysis =====

const runComparativeAnalysis = async () => {
    if (state.selectedCompanyIds.length < 2) return;
    showLoading();
    showAnalysis();
    try {
        const result = await api.compareCompanies(state.selectedCompanyIds);
        renderComparativeDashboard(result);
    } catch (error) { showToast(error.message, 'error'); }
    finally { hideLoading(); }
};

const renderComparativeDashboard = (data) => {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    const dashboard = document.createElement('div');
    dashboard.className = 'comparative-dashboard';

    // Summary
    if (data.ai_insights && data.ai_insights.summary) {
        const summary = document.createElement('div');
        summary.className = 'insight-card highlight';
        summary.innerHTML = `<h3>🤖 AI Executive Summary</h3><p>${data.ai_insights.summary}</p>`;
        if (data.ai_insights.best_performer) {
            summary.innerHTML += `<div class="badge-winner">🏆 Best Performer: ${data.ai_insights.best_performer}</div>`;
        }
        dashboard.appendChild(summary);
    }

    // Table
    if (data.comparison_table) {
        const tableCard = document.createElement('div');
        tableCard.className = 'insight-card';
        let html = `<h3>📉 Financial Comparison</h3><div class="table-responsive"><table class="comparison-table"><thead><tr><th>Metric</th>`;
        state.selectedCompanyIds.forEach(id => {
            const c = state.companies.find(comp => comp.id === id);
            html += `<th>${c ? c.name : id}</th>`;
        });
        html += `</tr></thead><tbody>`;
        Object.keys(data.comparison_table).forEach(metric => {
            html += `<tr><td class="metric-name">${formatRatioName(metric)}</td>`;
            state.selectedCompanyIds.forEach(id => {
                html += `<td>${formatRatio(data.comparison_table[metric][id])}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
        tableCard.innerHTML = html;
        dashboard.appendChild(tableCard);
    }

    container.appendChild(dashboard);
};

// ===== AI Command Interface =====

const handleCommand = (cmd) => {
    const text = cmd.toLowerCase();
    if (text.includes('compare')) {
        const found = state.companies.filter(c => text.includes(c.name.toLowerCase()));
        if (found.length >= 2) {
            state.selectedCompanyIds = found.map(c => c.id);
            localStorage.setItem(COMPANY_KEY, JSON.stringify(state.selectedCompanyIds));
            updateActiveChips();
            renderCompanyCards(state.companies);
            runComparativeAnalysis();
            showToast(`Comparing ${found.map(c => c.name).join(' and ')}`);
        } else {
            showToast("Specify at least 2 companies you want to compare.", "warning");
        }
    } else if (text.includes('add')) {
        const found = state.companies.find(c => text.includes(c.name.toLowerCase()));
        if (found) {
            if (!state.selectedCompanyIds.includes(found.id)) toggleCompanySelection(found.id);
        } else {
            showToast("Company not found. Want to create it?", "warning");
        }
    } else if (text.includes('clear') || text.includes('reset')) {
        state.selectedCompanyIds = [];
        localStorage.removeItem(COMPANY_KEY);
        updateActiveChips();
        renderCompanyCards(state.companies);
        showGrid();
    }
};

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Command Bar
    const cmdInput = document.getElementById('command-input');
    cmdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCommand(cmdInput.value);
            cmdInput.value = '';
        }
    });

    // Chat
    document.getElementById('chat-send-btn').addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        if (input.value) {
            addMessage('user', input.value);
            input.value = '';
            // Logic for AI reply would go here
        }
    });

    // Copilot
    setTimeout(() => {
        const bubble = document.getElementById('copilot-bubble');
        if (bubble) {
            bubble.classList.remove('hidden');
            bubble.querySelector('.copilot-close').onclick = () => bubble.classList.add('hidden');
        }
    }, 5000);

    // Login logic simplification
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const data = await api.login(email, password);
                state.token = data.access_token;
                localStorage.setItem(TOKEN_KEY, state.token);
                await checkAuth();
            } catch (e) { showToast("Login failed", "error"); }
        }
    }

    document.getElementById('logout-btn').onclick = logout;
});

const addMessage = (role, text) => {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `chat-message ${role}`;
    msg.innerHTML = `<div class="message-bubble">${text}</div>`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
};

// Global exports for inline handlers
window.toggleCompanySelection = toggleCompanySelection;
