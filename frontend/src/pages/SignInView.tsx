import React, { useState } from 'react';

interface SignInViewProps {
  onSignIn: (role: string) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({ onSignIn }) => {
  const [role, setRole] = useState('operator');
  const [username, setUsername] = useState('psca.operator');
  const [password, setPassword] = useState('••••••••');

  const roles = [
    { id: 'admin', name: 'Admin', desc: 'Users, data adapters, audit log and full configuration.', icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
    { id: 'operator', name: 'PSCA Operator', desc: 'Monitor emergencies, review AI decisions, authorise signal actions.', icon: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z' },
    { id: 'traffic', name: 'Traffic Operator', desc: 'Corridor status, traffic state and signal plans.', icon: 'M9 2h6a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM12 7h.01M12 12h.01M12 17h.01' },
    { id: 'research', name: 'Research (read-only)', desc: 'Digital twin, experiments and evaluation results only.', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(role);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: '#0B1220' }}>
      {/* Left Column: FYP Presentation */}
      <div
        style={{
          flex: '1 1 560px',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '40px',
          background: '#0F1A2E',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" role="img" aria-label="GreenCorridor AI logo">
            <rect x="2" y="2" width="36" height="36" rx="10" fill="#34D3A8" />
            <path d="M9 20h22" stroke="#06231C" strokeWidth="3" strokeLinecap="round" />
            <circle cx="13" cy="20" r="3.4" fill="#06231C" />
            <circle cx="20" cy="20" r="3.4" fill="#06231C" />
            <circle cx="27" cy="20" r="3.4" fill="#06231C" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 700, fontSize: '18px' }}>GreenCorridor AI</span>
            <span style={{ fontSize: '12px', color: '#A3B2CA' }}>Emergency vehicle priority layer</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: '#34D3A8' }}>
            FINAL YEAR PROJECT · UMT LAHORE
          </span>
          <h1 style={{ margin: 0, fontSize: '46px', lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.02em' }}>
            A moving green corridor for every emergency.
          </h1>
          <p style={{ margin: 0, fontSize: '17px', lineHeight: 1.55, color: '#A3B2CA' }}>
            An AI decision layer that routes the ambulance, predicts when it reaches each junction, and prepares
            signals ahead of it, with every command checked by a safety validator.
          </p>

          <svg viewBox="0 0 600 170" style={{ width: '100%', maxWidth: '600px', height: 'auto' }} role="img" aria-label="Corridor strip illustration">
            <rect x="20" y="82" width="560" height="14" rx="7" fill="#243350" />
            <rect x="20" y="82" width="190" height="14" rx="7" fill="#34D3A8" opacity="0.35" />
            <rect x="8" y="64" width="46" height="50" rx="10" fill="#0B1220" stroke="#FF7A7A" strokeWidth="2" />
            <path d="M31 78v22M20 89h22" stroke="#FF7A7A" strokeWidth="4" strokeLinecap="round" />
            <circle cx="31" cy="89" r="22" fill="none" stroke="#FF7A7A" strokeWidth="2" className="pulse" />
            <g fontFamily="'IBM Plex Sans', sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
              <circle cx="170" cy="89" r="17" fill="#34D3A8" /><text x="170" y="93" fill="#06231C">I1</text>
              <circle cx="285" cy="89" r="17" fill="#F6B93B" /><text x="285" y="93" fill="#2A1E00">I2</text>
              <circle cx="400" cy="89" r="17" fill="#7F90AB" /><text x="400" y="93" fill="#0B1220">I3</text>
              <circle cx="500" cy="89" r="17" fill="#7F90AB" /><text x="500" y="93" fill="#0B1220">I4</text>
              <rect x="548" y="64" width="46" height="50" rx="10" fill="#1E3A5F" /><text x="571" y="95" fontSize="20" fill="#E8EEF8">H</text>
              <text x="170" y="52" fill="#34D3A8">GREEN</text>
              <text x="285" y="52" fill="#F6B93B">PREPARING</text>
              <text x="400" y="52" fill="#A3B2CA">MONITOR</text>
              <text x="500" y="52" fill="#A3B2CA">MONITOR</text>
              <g fontFamily="'IBM Plex Mono', monospace" fontWeight="500" fill="#E8EEF8">
                <text x="170" y="132">ETA 12 s</text><text x="285" y="132">ETA 40 s</text><text x="400" y="132">ETA 85 s</text><text x="500" y="132">ETA 130 s</text>
              </g>
            </g>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#A3B2CA', lineHeight: 1.5 }}>
          <span>Muhammad Ahmad Asif · Muhammad Taimoor Nasir · Muhammad Usman Danial</span>
          <span>Advisor: Prof. Hafiz Ahsan Arshad · Co-advisor: Dr. Muhammad Husnain Ashfaq</span>
        </div>
      </div>

      {/* Right Column: Sign In Role Selector */}
      <div
        style={{
          flex: '1 1 460px',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '56px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Sign in</h2>
            <span style={{ fontSize: '14px', color: '#A3B2CA' }}>Choose a role to preview what each user sees.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} role="group" aria-label="Role">
            {roles.map((r) => {
              const on = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`pick ${on ? 'pick-on' : ''}`}
                  onClick={() => {
                    setRole(r.id);
                    if (r.id === 'operator') setUsername('psca.operator');
                    else if (r.id === 'admin') setUsername('demo.admin');
                    else if (r.id === 'traffic') setUsername('traffic.operator');
                    else setUsername('research.viewer');
                  }}
                  aria-pressed={on}
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
                    style={{ flex: 'none', marginTop: '1px' }}
                  >
                    <path d={r.icon} />
                  </svg>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{r.name}</span>
                    <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.4 }}>{r.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="u" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Username</label>
              <input
                id="u"
                className="field"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="p" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Password</label>
              <input
                id="p"
                className="field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-p" style={{ width: '100%' }}>
            Sign in to Command Center
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06231C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#A3B2CA' }}>
            <span style={{ padding: '4px 10px', border: '1px solid #243350', borderRadius: '999px' }}>Offline-first</span>
            <span style={{ padding: '4px 10px', border: '1px solid #243350', borderRadius: '999px' }}>Role-based access</span>
            <span style={{ padding: '4px 10px', border: '1px solid #243350', borderRadius: '999px' }}>Every action audit-logged</span>
          </div>
          <span style={{ fontSize: '12px', color: '#7F90AB', lineHeight: 1.5 }}>
            Prototype only: no real authentication. PSCA is the proposed environment, not a confirmed partner.
          </span>
        </form>
      </div>
    </div>
  );
};
