import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SignInView } from './pages/SignInView';
import { DashboardView } from './pages/DashboardView';
import { RoutingView } from './pages/RoutingView';
import { CorridorView } from './pages/CorridorView';
import { PerceptionView } from './pages/PerceptionView';
import { PredictionView } from './pages/PredictionView';
import { SafetyView } from './pages/SafetyView';
import { TwinView } from './pages/TwinView';
import { EvaluationView } from './pages/EvaluationView';
import { AdminView } from './pages/AdminView';
import { EmergencyIntakeView } from './pages/EmergencyIntakeView';
import { EmergenciesView, Incoming1122Request } from './pages/EmergenciesView';
import { EmergencyRecord } from './services/api';

import { apiService } from './services/api';

export function App() {
  const [activePage, setActivePage] = useState<PageId>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as PageId;
      const validPages: PageId[] = ['emergencies', 'dashboard', 'routing', 'corridor', 'perception', 'prediction', 'safety', 'twin', 'evaluation', 'admin', 'signin'];
      return validPages.includes(hash) ? hash : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [initialEmergency, setInitialEmergency] = useState<EmergencyRecord | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Incoming1122Request | null>(null);
  const [completedRequestIds, setCompletedRequestIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
  const [accessToken, setAccessToken] = useState<string | null>(() => apiService.getAuthToken());

  useEffect(() => {
    const handleHash = () => {
      try {
        const hash = window.location.hash.replace('#', '') as PageId;
        const validPages: PageId[] = ['emergencies', 'dashboard', 'routing', 'corridor', 'perception', 'prediction', 'safety', 'twin', 'evaluation', 'admin', 'signin'];
        if (validPages.includes(hash)) {
          setActivePage(hash);
        }
      } catch {}
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Operations Mode (Dark mode) persisted in localStorage with try/catch
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gc_operations_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Apply the selected operations theme consistently across all pages.
  useEffect(() => {
    try {
      localStorage.setItem('gc_operations_mode', String(darkMode));
    } catch {}

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, activePage]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const pageHeaders: Record<PageId, { title: string; subtitle: string; category: string }> = {
    signin: { category: 'Access', title: 'Sign in', subtitle: 'GreenCorridor AI authentication' },
    emergencies: { category: 'Operations', title: 'Emergencies', subtitle: 'Review incoming 1122 dispatch requests and authorize corridor creation' },
    dashboard: { category: 'Operations', title: 'Command Center', subtitle: 'Incoming 1122 calls, system alerts and active corridor operations' },
    routing: { category: 'Operations', title: 'Routing and Hospitals', subtitle: 'Hospitals ranked by predicted arrival time, not by distance' },
    corridor: { category: 'Operations', title: 'Green Corridor Planner', subtitle: 'One plan for the whole route: which signals, when to prepare, how long to hold' },
    perception: { category: 'Intelligence', title: 'Traffic Perception', subtitle: 'Vehicle detection, tracking and congestion level from camera feeds' },
    prediction: { category: 'Intelligence', title: 'Prediction', subtitle: 'Short-term traffic forecast and ambulance arrival time' },
    safety: { category: 'Assurance', title: 'Safety and Validation', subtitle: 'AI components only recommend. A rule-based validator approves or rejects every command.' },
    twin: { category: 'Assurance', title: 'Digital Twin', subtitle: 'SUMO model of a Lahore corridor: the safe place to test every strategy' },
    evaluation: { category: 'Assurance', title: 'Evaluation', subtitle: 'Six control strategies compared on identical SUMO scenarios' },
    admin: { category: 'Administration', title: 'Admin and Audit', subtitle: 'Users, role-based access, data handling and the full decision log' },
  };

  if (!accessToken) {
    return (
      <SignInView
        onSignIn={(token) => {
          apiService.setAuthToken(token);
          setInitialEmergency(null);
          setSelectedRequest(null);
          setCompletedRequestIds([]);
          setAccessToken(token);
          setActivePage('emergencies');
        }}
      />
    );
  }

  const currentHeader = pageHeaders[activePage] || pageHeaders.dashboard;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Sidebar container */}
        <div
          id="app-sidebar"
          className={`sidebar-nav ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          aria-hidden={!sidebarOpen}
          inert={!sidebarOpen}
        >
          <Sidebar
            active={activePage}
            onNavigate={(p) => {
              if (p === 'emergencies') setSelectedRequest(null);
              setActivePage(p);
              setSidebarOpen(false);
            }}
            onSignOut={() => {
              apiService.setAuthToken(null);
              setInitialEmergency(null);
              setSelectedRequest(null);
              setCompletedRequestIds([]);
              setAccessToken(null);
              setActivePage('signin');
              setSidebarOpen(false);
            }}
            darkMode={darkMode}
            onToggleDark={toggleDarkMode}
          />
        </div>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="sidebar-backdrop"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="top-bar-chrome">
            <TopBar
              title={currentHeader.title}
              subtitle={currentHeader.subtitle}
              category={currentHeader.category}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            />
          </div>

          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            style={{
              padding: '10px 32px 0',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Emergency Corridor</span>
            <span aria-hidden="true">/</span>
            <span>{currentHeader.category}</span>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{currentHeader.title}</span>
          </nav>

          <div style={{ flex: 1 }}>
            {activePage === 'emergencies' && (
              selectedRequest ? (
                <EmergencyIntakeView
                  key={selectedRequest.id}
                  initialSource="1122"
                  initialRequest={selectedRequest}
                  presentation="page"
                  onCancel={() => setSelectedRequest(null)}
                  onCreated={(emergency) => {
                    setInitialEmergency(emergency);
                    setCompletedRequestIds((current) => [...current, selectedRequest.id]);
                    setSelectedRequest(null);
                    setActivePage('dashboard');
                  }}
                />
              ) : (
                <EmergenciesView
                  completedRequestIds={completedRequestIds}
                  onSelectRequest={setSelectedRequest}
                />
              )
            )}
            {activePage === 'dashboard' && <DashboardView initialEmergency={initialEmergency} onNavigate={(p) => setActivePage(p)} />}
            {activePage === 'routing' && <RoutingView onNavigate={(p) => setActivePage(p)} />}
            {activePage === 'corridor' && <CorridorView onNavigate={(p) => setActivePage(p)} />}
            {activePage === 'perception' && <PerceptionView />}
            {activePage === 'prediction' && <PredictionView />}
            {activePage === 'safety' && <SafetyView />}
            {activePage === 'twin' && <TwinView onNavigate={(p) => setActivePage(p)} />}
            {activePage === 'evaluation' && <EvaluationView />}
            {activePage === 'admin' && <AdminView />}
          </div>

          {/* Footer on every page */}
          <footer className="page-footer" role="contentinfo">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                <span style={{ fontWeight: 600 }}>Emergency Green Corridor System</span>
                <span>·</span>
                <span>Version 1.0.0-PSCA.Sandbox</span>
                <span>·</span>
                <span>Simulation environment</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                <span>Advisors: Prof. Hafiz Ahsan Arshad · Dr. Muhammad Husnain Ashfaq</span>
                <span>·</span>
                <span className="mono">Build: 2026.11.03</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
