import React from 'react';
import { Menu, Shield, Moon, Sun, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle: string;
  category?: string;
  darkMode?: boolean;
  onToggleDark?: () => void;
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  darkMode = false,
  onToggleDark,
  onToggleSidebar,
}) => {
  return (
    <>
      <header
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '64px',
          padding: '12px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'var(--navy-800)',
          color: '#FFFFFF',
        }}
      >
        {/* Left: Mobile menu toggle + Page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation Menu"
              className="md:hidden"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#FFFFFF',
              }}
            >
              {title}
            </h1>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
              {subtitle}
            </span>
          </div>
        </div>

        {/* Right Chrome Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {/* Mode Switcher / Sandbox Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 10px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '0.02em',
            }}
          >
            <SlidersHorizontal size={13} strokeWidth={1.5} style={{ color: 'var(--accent-gold)' }} />
            <span>SUMO TraCI</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>PTSC Sandbox</span>
          </div>

          {/* System Status: Live / Simulated */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 10px',
              borderRadius: '2px',
              background: 'rgba(221, 170, 1, 0.12)',
              border: '1px solid rgba(221, 170, 1, 0.4)',
              color: '#FFDF6D',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <span
              className="live-dot"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#FFDD00',
              }}
            />
            <span>SIMULATED · LIVE FEED</span>
          </div>

          {/* User Role Chip */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 10px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Shield size={13} strokeWidth={1.5} style={{ color: 'var(--accent-gold)' }} />
            <span>PSCA Officer</span>
          </div>

          {/* Operations Mode Toggle */}
          {onToggleDark && (
            <button
              type="button"
              onClick={onToggleDark}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Operations Mode (Dark)'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '30px',
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {darkMode ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>
          )}
        </div>
      </header>

      {/* Thin 3px Gold Rule Beneath Topbar */}
      <div
        className="top-bar-gold-rule"
        style={{
          height: '3px',
          background: 'var(--accent-gold)',
          width: '100%',
        }}
        aria-hidden="true"
      />
    </>
  );
};
