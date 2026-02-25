"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Components
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import KpiCards from '../components/KpiCards';
const RevenueChart = dynamic(() => import('../components/RevenueChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-white/5 animate-pulse rounded-2xl" />
});
const CopilotPanel = dynamic(() => import('../components/CopilotPanel'), { ssr: false });
const OnboardingForm = dynamic(() => import('../components/OnboardingForm'), { ssr: false });
import CompanyTable from '../components/CompanyTable';
import AiSuggestionBubble from '../components/AiSuggestionBubble';
import PortfolioOverview from '../components/PortfolioOverview';
import dynamic from 'next/dynamic';

export default function DashboardPage() {
  // Auth
  const { user, role, loading: authLoading, isAuthenticated } = useAuth();

  // Data state
  const [companies, setCompanies] = useState([]);
  const [portfolioData, setPortfolioData] = useState({});
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // UI state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'portfolio'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [companiesData, portfolioRes] = await Promise.allSettled([
        api.getCompanies(),
        api.request('/analysis/portfolio/summary'),
      ]);

      const companiesList = companiesData.status === 'fulfilled' ? companiesData.value : [];
      setCompanies(companiesList);

      const portfolio = portfolioRes.status === 'fulfilled' ? portfolioRes.value : {};
      setPortfolioData(portfolio);

      // Generate AI suggestion
      if (companiesList.length > 0) {
        const highRisk = portfolio.high_risk_count || 0;
        if (highRisk > 0) {
          setAiSuggestion(`${highRisk} ${highRisk === 1 ? 'company needs' : 'companies need'} immediate attention based on risk assessment.`);
        } else {
          setAiSuggestion(`${companiesList.length} clients tracked. Portfolio health looks stable.`);
        }
      } else {
        setAiSuggestion('Add your first client to get AI-powered financial insights.');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 120000); // refresh every 2 min
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchData]);

  // Listen for sidebar collapse from custom event (much faster than polling)
  useEffect(() => {
    const handleSync = (e) => {
      setSidebarCollapsed(e.detail.collapsed);
    };

    // Initial load
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) setSidebarCollapsed(JSON.parse(saved));

    window.addEventListener('sidebar_sync', handleSync);
    return () => window.removeEventListener('sidebar_sync', handleSync);
  }, []);

  // Handlers
  const handleSelectClient = useCallback((id) => {
    setSelectedClientIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleDeleteCompany = useCallback(async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteCompany(id);
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [fetchData]);

  const handleSendMessage = useCallback(async (message) => {
    const userMsg = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const companyId = selectedClientIds.length === 1 ? selectedClientIds[0] : null;
      const response = await api.sendChatMessage(message, null, companyId);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [selectedClientIds]);

  const handleCommand = useCallback((cmd) => {
    if (cmd.trim()) {
      setChatOpen(true);
      handleSendMessage(cmd);
    }
  }, [handleSendMessage]);

  const handleCompanyCreated = useCallback(() => {
    setShowOnboarding(false);
    fetchData();
  }, [fetchData]);

  const handleToggleChat = useCallback(() => setChatOpen(prev => !prev), []);
  const handleCloseChat = useCallback(() => setChatOpen(false), []);

  const handleNavChange = useCallback((navId) => {
    if (navId === 'dashboard') {
      setActiveTab('dashboard');
    } else if (navId === 'reports') {
      setActiveTab('portfolio');
    }
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
          <div className="w-6 h-6 rounded-lg bg-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const sidebarWidth = sidebarCollapsed ? 72 : 280;

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <Navbar
        onCommand={handleCommand}
        userName={user?.full_name || user?.email}
        onLogout={() => { window.location.href = '/login'; }}
        onToggleChat={() => setChatOpen(!chatOpen)}
        chatOpen={chatOpen}
        alertCount={portfolioData.high_risk_count || 0}
      />

      {/* Sidebar */}
      <Sidebar
        onSelectClient={handleSelectClient}
        selectedClientIds={selectedClientIds}
        onAddClient={() => setShowOnboarding(true)}
        onCompare={() => { }}
        activeNav={activeTab === 'portfolio' ? 'reports' : 'dashboard'}
        onNavChange={handleNavChange}
      />

      {/* Main Content */}
      <main
        className="pt-20 pb-8 px-6 transition-all duration-300"
        style={{
          marginLeft: sidebarWidth,
          marginRight: chatOpen ? 400 : 0,
        }}
      >
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-white/5 rounded-xl w-fit border border-white/5">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'portfolio', label: 'Portfolio' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-slate-500 hover:text-white border border-transparent'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* KPI Cards */}
            <KpiCards
              data={{
                total_revenue: portfolioData.total_revenue || 0,
                avg_health_score: portfolioData.avg_health_score || 0,
                total_companies: companies.length,
                high_risk_count: portfolioData.high_risk_count || 0,
              }}
            />

            {/* Chart + Suggestion Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <RevenueChart />
              </div>
              <div className="flex flex-col justify-end">
                <AiSuggestionBubble
                  suggestion={aiSuggestion}
                  onOpenChat={() => setChatOpen(true)}
                  visible={!!aiSuggestion}
                />
              </div>
            </div>

            {/* Company Table */}
            <CompanyTable
              companies={companies}
              onSelectCompany={handleSelectClient}
              onDeleteCompany={role === 'admin' ? handleDeleteCompany : null}
              selectedIds={selectedClientIds}
            />
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <PortfolioOverview />
          </div>
        )}
      </main>

      {/* AI Chat Panel */}
      <CopilotPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
      />

      {/* Onboarding Modal */}
      <OnboardingForm
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSuccess={handleCompanyCreated}
      />
    </div>
  );
}
