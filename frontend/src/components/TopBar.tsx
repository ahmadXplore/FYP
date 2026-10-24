import React from 'react';

interface TopBarProps {
  title: string;
  subtitle: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  return (
    <header
      style={{
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '76px',
        padding: '14px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px 24px',
        background: '#0B1220',
        borderBottom: '1px solid #243350',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: '#E8EEF8',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        <span style={{ fontSize: '13px', color: '#A3B2CA' }}>{subtitle}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '32px',
            padding: '0 12px',
            borderRadius: '999px',
            background: 'rgba(246,185,59,.12)',
            border: '1px solid rgba(246,185,59,.35)',
            color: '#F6B93B',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Prototype · sample data
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '32px',
            padding: '0 12px',
            borderRadius: '999px',
            background: '#121C2F',
            border: '1px solid #243350',
            color: '#E8EEF8',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34D3A8',
            }}
          ></span>
          All modules healthy
        </span>

        <span
          aria-label="Notifications"
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#121C2F',
            border: '1px solid #243350',
            color: '#A3B2CA',
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
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span
            style={{
              position: 'absolute',
              top: '10px',
              right: '11px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#FF7A7A',
            }}
          ></span>
        </span>
      </div>
    </header>
  );
};
