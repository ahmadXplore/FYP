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
import { EmergencyRecord } from './services/api';

export function App() {
  const [activePage, setActivePage] = useState<PageId>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as PageId;
      const validPages: PageId[] = ['dashboard', 'routing', 'corridor', 'perception', 'prediction', 'safety', 'twin', 'evaluation', 'admin', 'signin'];
      return validPages.includes(hash) ? hash : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [hasStartedEmergency, setHasStartedEmergency] = useState(false);
  const [initialEmergency, setInitialEmergency] = useState<EmergencyRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      try {
        const hash = window.location.hash.replace('#', '') as PageId;
        const validPages: PageId[] = ['dashboard', 'routing', 'corridor', 'perception', 'prediction', 'safety', 'twin', 'evaluation', 'admin', 'signin'];
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

  // Switch to dark operations mode automatically if on corridor planner, or respect user toggle
  useEffect(() => {
    try {
      localStorage.setItem('gc_operations_mode', String(darkMode));
    } catch {}

    if (darkMode || activePage === 'corridor') {
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

  if (!hasStartedEmergency) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="classification-banner" role="banner">
          Final Year Project, UMT Lahore. Proposed deployment environment: PSCA PPIC3. Simulation and sandbox data only.
        </div>
        <EmergencyIntakeView
          initialSource="1122"
          presentation="page"
          onCreated={(emergency) => {
            setInitialEmergency(emergency);
            setHasStartedEmergency(true);
            setActivePage('dashboard');
          }}
        />
      </div>
    );
  }

  if (activePage === 'signin') {
    return <SignInView onSignIn={() => setActivePage('dashboard')} />;
  }

  const currentHeader = pageHeaders[activePage] || pageHeaders.dashboard;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Classification banner across the very top */}
      <div className="classification-banner" role="banner">
        Final Year Project, UMT Lahore. Proposed deployment environment: PSCA PPIC3. Simulation and sandbox data only.
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Sidebar container */}
        <div
          className={`sidebar-nav ${sidebarOpen ? 'sidebar-open' : ''}`}
          style={{
            flex: '0 0 260px',
            maxWidth: '260px',
            minWidth: '240px',
            zIndex: 30,
          }}
        >
          <Sidebar
            active={activePage}
            onNavigate={(p) => {
              setActivePage(p);
              setSidebarOpen(false);
            }}
            onSignOut={() => {
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
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(11, 12, 12, 0.6)',
              zIndex: 25,
            }}
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
              darkMode={darkMode}
              onToggleDark={toggleDarkMode}
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
