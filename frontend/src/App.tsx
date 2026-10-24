import React, { useState } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SignInView } from './pages/SignInView';
import { DashboardView } from './pages/DashboardView';
import { EmergencyView } from './pages/EmergencyView';
import { RoutingView } from './pages/RoutingView';
import { CorridorView } from './pages/CorridorView';
import { PerceptionView } from './pages/PerceptionView';
import { PredictionView } from './pages/PredictionView';
import { SafetyView } from './pages/SafetyView';
import { TwinView } from './pages/TwinView';
import { EvaluationView } from './pages/EvaluationView';
import { AdminView } from './pages/AdminView';

export function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const pageHeaders: Record<PageId, { title: string; subtitle: string }> = {
    signin: { title: 'Sign in', subtitle: 'GreenCorridor AI authentication' },
    dashboard: { title: 'Command Center', subtitle: 'Live emergency corridor monitoring · AMB-017 en route' },
    emergency: { title: 'New Emergency', subtitle: 'Register an incident and let the system plan route, hospital and corridor' },
    routing: { title: 'Routing and Hospitals', subtitle: 'Hospitals ranked by predicted arrival time, not by distance' },
    corridor: { title: 'Green Corridor Planner', subtitle: 'One plan for the whole route: which signals, when to prepare, how long to hold' },
    perception: { title: 'Traffic Perception', subtitle: 'Vehicle detection, tracking and congestion level from camera feeds' },
    prediction: { title: 'Prediction', subtitle: 'Short-term traffic forecast and ambulance arrival time' },
    safety: { title: 'Safety and Validation', subtitle: 'AI components only recommend. A rule-based validator approves or rejects every command.' },
    twin: { title: 'Digital Twin', subtitle: 'SUMO model of a Lahore corridor: the safe place to test every strategy' },
    evaluation: { title: 'Evaluation', subtitle: 'Six control strategies compared on identical SUMO scenarios' },
    admin: { title: 'Admin and Audit', subtitle: 'Users, role-based access, data handling and the full decision log' },
  };

  if (activePage === 'signin') {
    return <SignInView onSignIn={() => setActivePage('dashboard')} />;
  }

  const currentHeader = pageHeaders[activePage] || pageHeaders.dashboard;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: '#0B1220' }}>
      {/* Sidebar container */}
      <div style={{ flex: '1 1 248px', maxWidth: '272px', minWidth: '220px' }}>
        <Sidebar
          active={activePage}
          onNavigate={(p) => setActivePage(p)}
          onSignOut={() => setActivePage('signin')}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
        />

        {activePage === 'dashboard' && <DashboardView onNavigate={(p) => setActivePage(p)} />}
        {activePage === 'emergency' && <EmergencyView onNavigate={(p) => setActivePage(p)} />}
        {activePage === 'routing' && <RoutingView onNavigate={(p) => setActivePage(p)} />}
        {activePage === 'corridor' && <CorridorView onNavigate={(p) => setActivePage(p)} />}
        {activePage === 'perception' && <PerceptionView />}
        {activePage === 'prediction' && <PredictionView />}
        {activePage === 'safety' && <SafetyView />}
        {activePage === 'twin' && <TwinView onNavigate={(p) => setActivePage(p)} />}
        {activePage === 'evaluation' && <EvaluationView />}
        {activePage === 'admin' && <AdminView />}
      </div>
    </div>
  );
}

export default App;
