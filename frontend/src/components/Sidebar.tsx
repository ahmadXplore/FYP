import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  GitBranch,
  Video,
  TrendingUp,
  ShieldCheck,
  Layers,
  BarChart3,
  Sliders,
  LogOut,
  Shield,
  Sun,
  Moon
} from 'lucide-react';

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
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  active,
  onNavigate,
  onSignOut,
  darkMode = false,
  onToggleDark,
}) => {
  const groups = [
    {
      label: 'Operations',
      items: [
        { id: 'dashboard' as PageId, label: 'Command Center', icon: LayoutDashboard },
        { id: 'routing' as PageId, label: 'Routing & Hospitals', icon: Navigation },
        { id: 'corridor' as PageId, label: 'Green Corridor', icon: GitBranch },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { id: 'perception' as PageId, label: 'Traffic Perception', icon: Video },
        { id: 'prediction' as PageId, label: 'Prediction', icon: TrendingUp },
      ],
    },
    {
      label: 'Assurance',
      items: [
        { id: 'safety' as PageId, label: 'Safety & Validation', icon: ShieldCheck },
        { id: 'twin' as PageId, label: 'Digital Twin', icon: Layers },
        { id: 'evaluation' as PageId, label: 'Evaluation', icon: BarChart3 },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'admin' as PageId, label: 'Admin & Audit', icon: Sliders },
      ],
    },
  ];

  return (
    <aside
      aria-label="Navigation Sidebar"
      style={{
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: darkMode ? 'var(--navy-900)' : 'var(--surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Public Sans', Inter, system-ui, sans-serif",
        color: 'var(--text)',
      }}
    >
      {/* Top Branding Section */}
      <div
        style={{
          background: 'var(--navy-800)',
          color: '#FFFFFF',
          padding: '16px 18px',
          borderBottom: '3px solid var(--accent-gold)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(221, 170, 1, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold)',
            flexShrink: 0,
          }}
        >
          <Shield size={18} strokeWidth={1.5} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.01em' }}>
            Emergency Green
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
            Corridor System
          </span>
        </div>
      </div>

      {/* Navigation Group Items */}
      <div
        style={{
          flex: 1,
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto',
        }}
      >
        {groups.map((g) => (
          <div key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                padding: '0 12px 6px',
              }}
            >
              {g.label}
            </span>
            {g.items.map((it) => {
              const on = it.id === active;
              const IconComponent = it.icon;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onNavigate(it.id)}
                  aria-current={on ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minHeight: '40px',
                    boxSizing: 'border-box',
                    padding: '0 12px',
                    borderRadius: '4px',
                    border: 'none',
                    borderLeft: on ? '3px solid var(--accent-gold)' : '3px solid transparent',
                    fontSize: '13px',
                    fontWeight: on ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: on
                      ? darkMode
                        ? 'var(--surface-raised)'
                        : 'var(--navy-50)'
                      : 'transparent',
                    color: on
                      ? darkMode
                        ? '#FFFFFF'
                        : 'var(--navy-900)'
                      : 'var(--text-secondary)',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    width: '100%',
                  }}
                >
                  <IconComponent
                    size={18}
                    strokeWidth={1.5}
                    style={{
                      flex: 'none',
                      color: on
                        ? 'var(--accent-gold)'
                        : 'var(--text-secondary)',
                    }}
                  />
                  <span style={{ flex: 1 }}>{it.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Controls & User Status */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: darkMode ? 'var(--surface)' : 'var(--surface-alt)',
        }}
      >
        {/* Operations Mode toggle */}
        {onToggleDark && (
          <button
            type="button"
            onClick={onToggleDark}
            aria-pressed={darkMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {darkMode ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
              <span>{darkMode ? 'Standard Light' : 'Operations Mode'}</span>
            </span>
            <span className="chip c-gray" style={{ height: '18px', fontSize: '10px' }}>
              {darkMode ? 'DARK' : 'LIGHT'}
            </span>
          </button>
        )}

        {/* System Simulation State Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '4px',
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <span
            className="live-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--success)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 500 }}>TraCI · Digital Twin Active</span>
        </div>

        {/* User Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 0',
          }}
        >
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              background: 'var(--navy-800)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '11px',
              flexShrink: 0,
            }}
          >
            DO
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, lineHeight: 1.25 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Demo Operator</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PSCA PPIC3 Console</span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
};
