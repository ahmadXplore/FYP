import React from 'react';

export type PageId =
  | 'signin'
  | 'dashboard'
  | 'routing'
  | 'corridor'
  | 'perception'
  | 'prediction'
  | 'safety'
  | 'twin'
  | 'evaluation'
  | 'admin';

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, onSignOut }) => {
  const icons: Record<string, string> = {
    dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
    routing: 'M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 17h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6',
    corridor: 'M9 2h6a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM12 7h.01M12 12h.01M12 17h.01',
    perception: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    prediction: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    safety: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
    twin: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7',
    evaluation: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    admin: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  };

  const groups = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'dashboard' as PageId, label: 'Command Center' },
        { id: 'routing' as PageId, label: 'Routing & Hospitals' },
        { id: 'corridor' as PageId, label: 'Green Corridor' },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'perception' as PageId, label: 'Traffic Perception' },
        { id: 'prediction' as PageId, label: 'Prediction' },
      ],
    },
    {
      label: 'ASSURANCE',
      items: [
        { id: 'safety' as PageId, label: 'Safety & Validation' },
        { id: 'twin' as PageId, label: 'Digital Twin' },
        { id: 'evaluation' as PageId, label: 'Evaluation' },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'admin' as PageId, label: 'Admin & Audit' },
      ],
    },
  ];

  return (
    <nav
      aria-label="Main"
      style={{
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: '#0F1A2E',
        borderRight: '1px solid #243350',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: '#E8EEF8',
      }}
    >
      {/* Brand */}
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 8px',
          color: 'inherit',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
          <rect x="2" y="2" width="36" height="36" rx="10" fill="#34D3A8" />
          <path d="M9 20h22" stroke="#06231C" stroke-width="3" stroke-linecap="round" />
          <circle cx="13" cy="20" r="3.4" fill="#06231C" />
          <circle cx="20" cy="20" r="3.4" fill="#06231C" />
          <circle cx="27" cy="20" r="3.4" fill="#06231C" />
        </svg>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>GreenCorridor AI</span>
          <span style={{ fontSize: '11px', color: '#A3B2CA' }}>Emergency priority layer</span>
        </span>
      </button>

      {/* Nav Groups */}
      {groups.map((g) => (
        <div key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: '#7F90AB',
              padding: '0 10px 6px',
            }}
          >
            {g.label}
          </span>
          {g.items.map((it) => {
            const on = it.id === active;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onNavigate(it.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: on ? 'rgba(52,211,168,.14)' : 'transparent',
                  color: on ? '#E8EEF8' : '#A3B2CA',
                  transition: 'all 0.12s ease',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={on ? '#34D3A8' : '#A3B2CA'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ flex: 'none' }}
                >
                  <path d={icons[it.id] || ''} />
                </svg                >
                <span style={{ flex: 1 }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      ))}

      {/* Footer Info & Sign out */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: '#121C2F',
            border: '1px solid #243350',
            fontSize: '12px',
            color: '#A3B2CA',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34D3A8',
              flex: 'none',
            }}
          ></span>
          <span>Mode 2 · Digital twin (SUMO)</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 8px',
          }}
        >
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#1E3A5F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              flex: 'none',
              color: '#E8EEF8',
            }}
          >
            DO
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Demo Operator</span>
            <span style={{ fontSize: '12px', color: '#A3B2CA' }}>PSCA Operator</span>
          </span>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out to Welcome Screen"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              color: '#A3B2CA',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};
