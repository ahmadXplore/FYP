import React, { useState } from 'react';
import { Shield, LayoutDashboard, Sliders, Eye, ArrowRight } from 'lucide-react';

interface SignInViewProps {
  onSignIn: (role: string) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({ onSignIn }) => {
  const [role, setRole] = useState('operator');
  const [username, setUsername] = useState('psca.operator');
  const [password, setPassword] = useState('••••••••');

  const roles = [
    {
      id: 'admin',
      name: 'System Administrator',
      desc: 'Users, data adapters, tamper-evident audit log and complete safety configuration.',
      icon: Shield,
    },
    {
      id: 'operator',
      name: 'PSCA PPIC3 Operator',
      desc: 'Live emergency monitoring, route review, safety validator approval and preemption override.',
      icon: LayoutDashboard,
    },
    {
      id: 'traffic',
      name: 'Traffic Operations Officer',
      desc: 'Signal network phase coordination, camera perception feeds and queue recovery status.',
      icon: Sliders,
    },
    {
      id: 'research',
      name: 'Academic Evaluator (Read-only)',
      desc: 'SUMO digital twin benchmarks, empirical RQ metrics and comparative evaluation data.',
      icon: Eye,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(role);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: 'var(--bg)' }}>
      {/* Left Column: Official Public Sector Context */}
      <div
        style={{
          flex: '1 1 540px',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '36px',
          background: 'var(--navy-800)',
          color: '#FFFFFF',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
            }}
          >
            <Shield size={20} strokeWidth={1.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.01em' }}>
              Emergency Green Corridor System
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>
              Dynamic Priority and Automated Route Clearance
            </span>
          </div>
        </div>

        {/* Core mission statement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '600px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
            }}
          >
            Final Year Project · UMT Lahore · Proposed for PSCA PPIC3
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: '36px',
              lineHeight: 1.2,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
            }}
          >
            Automated Green Wave Preemption for Emergency Response Vehicles.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            An authoritative, safety-governed traffic priority layer. Computes dynamic route arrival predictions,
            prepares intersections ahead of the emergency vehicle, and validates every signal actuation against
            Punjab Safe Cities Authority safety constraints.
          </p>

          {/* Corridor Strip Diagram (clean, flat, high-contrast, no glow) */}
          <div
            style={{
              padding: '16px',
              borderRadius: '4px',
              background: 'rgba(6, 22, 45, 0.6)',
              border: '1px solid rgba(223, 227, 232, 0.2)',
            }}
          >
            <svg
              viewBox="0 0 600 130"
              style={{ width: '100%', height: 'auto' }}
              role="img"
              aria-label="Schematic representation of moving green corridor across 4 junctions to hospital"
            >
              {/* Arterial roadway */}
              <rect x="20" y="60" width="560" height="12" rx="2" fill="var(--navy-600)" />
              {/* Active green segment */}
              <rect x="20" y="60" width="160" height="12" rx="2" fill="var(--success)" opacity="0.6" />

              {/* Ambulance marker at start */}
              <g transform="translate(24 46)">
                <rect width="28" height="28" rx="2" fill="var(--danger)" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M14 6v16M6 14h16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="square" />
              </g>

              {/* Intersections I1 to I4 */}
              <g fontFamily="'IBM Plex Mono', monospace" fontSize="11" fontWeight="600" textAnchor="middle">
                {/* I1 - Green */}
                <circle cx="170" cy="66" r="14" fill="var(--success)" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="170" y="70" fill="#FFFFFF">I1</text>
                <text x="170" y="38" fill="var(--success)" fontFamily="'Public Sans', sans-serif" fontSize="10" fontWeight="700">GREEN</text>
                <text x="170" y="98" fill="rgba(255,255,255,0.7)" fontSize="10">ETA 0:12</text>

                {/* I2 - Preparing */}
                <circle cx="285" cy="66" r="14" fill="var(--warning)" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="285" y="70" fill="#0B0C0C">I2</text>
                <text x="285" y="38" fill="var(--warning)" fontFamily="'Public Sans', sans-serif" fontSize="10" fontWeight="700">PREPARING</text>
                <text x="285" y="98" fill="rgba(255,255,255,0.7)" fontSize="10">ETA 0:40</text>

                {/* I3 - Monitoring */}
                <circle cx="400" cy="66" r="14" fill="var(--text-secondary)" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="400" y="70" fill="#FFFFFF">I3</text>
                <text x="400" y="38" fill="rgba(255,255,255,0.7)" fontFamily="'Public Sans', sans-serif" fontSize="10" fontWeight="700">MONITOR</text>
                <text x="400" y="98" fill="rgba(255,255,255,0.7)" fontSize="10">ETA 1:25</text>

                {/* I4 - Monitoring */}
                <circle cx="500" cy="66" r="14" fill="var(--text-secondary)" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="500" y="70" fill="#FFFFFF">I4</text>
                <text x="500" y="38" fill="rgba(255,255,255,0.7)" fontFamily="'Public Sans', sans-serif" fontSize="10" fontWeight="700">MONITOR</text>
                <text x="500" y="98" fill="rgba(255,255,255,0.7)" fontSize="10">ETA 2:10</text>

                {/* Hospital destination */}
                <rect x="546" y="48" width="34" height="36" rx="2" fill="var(--navy-700)" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="563" y="72" fontSize="18" fontWeight="700" fill="#FFFFFF">H</text>
                <text x="563" y="98" fill="rgba(255,255,255,0.7)" fontSize="10">HOSPITAL</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Project Authors and Institutional Line */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.75)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '16px',
          }}
        >
          <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
            Project Team: Muhammad Ahmad Asif · Muhammad Taimoor Nasir · Muhammad Usman Danial
          </span>
          <span>Advisors: Prof. Hafiz Ahsan Arshad · Dr. Muhammad Husnain Ashfaq</span>
          <span style={{ color: 'var(--accent-gold)' }}>Department of Computer Science, UMT Lahore</span>
        </div>
      </div>

      {/* Right Column: Console Access */}
      <div
        style={{
          flex: '1 1 440px',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '48px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            maxWidth: '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="lbl">Control Room Authentication</span>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
              Operator Console Sign In
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Select an operational role to access assigned telemetry and control privileges.
            </span>
          </div>

          {/* Role selector buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="group" aria-label="Operational Role">
            {roles.map((r) => {
              const on = role === r.id;
              const IconComp = r.icon;
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
                  style={{
                    padding: '10px 12px',
                    gap: '12px',
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '2px',
                      background: on ? 'var(--navy-800)' : 'var(--surface-alt)',
                      color: on ? '#FFFFFF' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={16} strokeWidth={1.5} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                      {r.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {r.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Credentials input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="u" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Operator ID / Username
              </label>
              <input
                id="u"
                className="field"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="p" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Security Access Token / Password
              </label>
              <input
                id="p"
                className="field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button type="submit" className="btn-p" style={{ width: '100%' }}>
            <span>Sign In to Operational Console</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>

          {/* Security & Audit guarantees */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ padding: '3px 8px', border: '1px solid var(--border-subtle)', borderRadius: '2px', background: 'var(--surface-alt)' }}>
              On-Premise Isolated
            </span>
            <span style={{ padding: '3px 8px', border: '1px solid var(--border-subtle)', borderRadius: '2px', background: 'var(--surface-alt)' }}>
              Role-Based Access
            </span>
            <span style={{ padding: '3px 8px', border: '1px solid var(--border-subtle)', borderRadius: '2px', background: 'var(--surface-alt)' }}>
              All Actions Audit-Logged
            </span>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            PSCA PPIC3 is the proposed evaluation deployment environment. Simulation and synthetic telemetry only.
          </span>
        </form>
      </div>
    </div>
  );
};
