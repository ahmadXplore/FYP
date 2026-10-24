import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Sidebar';
import { apiService, SimulationResult } from '../services/api';

interface TwinViewProps {
  onNavigate: (page: PageId) => void;
}

export const TwinView: React.FC<TwinViewProps> = ({ onNavigate }) => {
  const [scenario, setScenario] = useState('peak');
  const [strategy, setStrategy] = useState('E');
  const [lock, setLock] = useState(false);
  const [p, setP] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const iv = setInterval(() => {
      if (!running) return;
      setP((prev) => {
        const next = Math.min(1, prev + 0.04);
        if (next >= 1) {
          setRunning(false);
          setDone(true);
          return 1;
        }
        return next;
      });
    }, 120);

    return () => clearInterval(iv);
  }, [running]);

  const fmt = (sec: number) => {
    const s = Math.round(sec);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };

  const SC = [
    { id: 'off', name: 'Off-peak', desc: 'Light traffic', base: 360, stops: 3 },
    { id: 'peak', name: 'Peak hour', desc: 'Dense mixed traffic', base: 600, stops: 6 },
    { id: 'inc', name: 'Incident', desc: 'Blocked lane ahead', base: 720, stops: 8 }
  ];

  const ST = [
    { id: 'A', name: 'Normal signals (baseline)', f: 1.0, stopF: 1, delay: 0 },
    { id: 'B', name: 'Reactive emergency preemption', f: 0.9, stopF: 0.7, delay: 9 },
    { id: 'C', name: 'Traffic-aware routing only', f: 0.84, stopF: 0.8, delay: 2 },
    { id: 'D', name: 'Routing + green corridor', f: 0.74, stopF: 0.4, delay: 7 },
    { id: 'E', name: 'Prediction + green corridor', f: 0.67, stopF: 0.25, delay: 5 },
    { id: 'F', name: 'PPO + prediction + corridor', f: 0.63, stopF: 0.2, delay: 4 }
  ];

  const sc = SC.find((x) => x.id === scenario) || SC[1];
  const st = ST.find((x) => x.id === strategy) || ST[4];

  const adapters = [
    { name: 'Traffic data provider: simulation', iface: 'TrafficDataProvider', status: 'ACTIVE', cls: 'c-green' },
    { name: 'Signal controller: SUMO (TraCI)', iface: 'SignalController', status: 'ACTIVE', cls: 'c-green' },
    { name: 'Traffic data provider: PSCA', iface: 'TrafficDataProvider', status: 'NOT CONNECTED', cls: 'c-gray' },
    { name: 'Signal controller: PSCA PTSC', iface: 'SignalController · sandbox first', status: 'NOT AUTHORISED', cls: 'c-gray' }
  ];

  const handleRun = async () => {
    setP(0);
    setDone(false);
    setSimResult(null);
    setRunning(true);
    // Animate progress bar while waiting for backend
    const result = await apiService.runSimulation(scenario, strategy);
    setSimResult(result);
    setRunning(false);
    setP(1);
    setDone(true);
  };

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Operating Mode */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Operating mode">
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Operating mode</h2>
        <div role="group" aria-label="Mode" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button type="button" className="pick pick-on" style={{ flex: '1 1 280px', gap: '6px' }} aria-pressed="true">
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              Mode 2 · Digital twin / simulation <span className="chip c-green">ACTIVE</span>
            </span>
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#A3B2CA', lineHeight: 1.45 }}>
              Public, recorded or synthetic observations calibrate SUMO. The AI controller acts on simulated signals through TraCI.
            </span>
          </button>

          <button
            type="button"
            className="pick"
            style={{ flex: '1 1 280px', gap: '6px' }}
            onClick={() => setLock(true)}
            aria-pressed="false"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3B2CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Mode 1 · PSCA real data <span className="chip c-gray">LOCKED</span>
            </span>
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#A3B2CA', lineHeight: 1.45 }}>
              Authorised PSCA data flows through the same pipeline. Available only if collaboration is confirmed.
            </span>
          </button>
        </div>

        {lock && (
          <div
            role="status"
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(246,185,59,.10)',
              border: '1px solid rgba(246,185,59,.4)',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#F6B93B',
            }}
          >
            Mode 1 needs PSCA authorisation, which is not confirmed. The system stays on the digital twin. Switching modes later means swapping an adapter, not rewriting the system.
          </div>
        )}
      </section>

      {/* Main Grid: Simulation & Model */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Run a simulation */}
        <section className="card" style={{ flex: '3 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '18px' }} aria-label="Run a simulation">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Run a simulation</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="lbl" id="sc-l">Scenario</span>
            <div role="group" aria-labelledby="sc-l" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {SC.map((s) => {
                const on = scenario === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`pick ${on ? 'pick-on' : ''}`}
                    style={{ flex: '1 1 140px' }}
                    onClick={() => {
                      setScenario(s.id);
                      setDone(false);
                      setP(0);
                    }}
                    aria-pressed={on}
                  >
                    {s.name}
                    <span style={{ fontSize: '12px', fontWeight: 400, color: '#A3B2CA' }}>{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="lbl" id="st-l">Control strategy</span>
            <div role="group" aria-labelledby="st-l" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {ST.map((t) => {
                const on = strategy === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`pick ${on ? 'pick-on' : ''}`}
                    style={{ flex: '1 1 200px' }}
                    onClick={() => {
                      setStrategy(t.id);
                      setDone(false);
                      setP(0);
                    }}
                    aria-pressed={on}
                  >
                    <span className="mono" style={{ color: '#34D3A8' }}>{t.id}</span>
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <button type="button" className="btn-p" onClick={handleRun}>
              {running ? 'Running…' : done ? 'Run again' : 'Run simulation'}
            </button>
            <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ height: '8px', borderRadius: '999px', background: '#243350', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: '#34D3A8', width: `${Math.round(p * 100)}%` }}></div>
              </div>
              <span className="mono" style={{ fontSize: '12px', color: '#A3B2CA' }}>
                {running
                  ? `Simulating ${Math.round(p * 10)} of 10 seeds`
                  : done
                  ? '10 of 10 seeds complete'
                  : 'Ready. 10 random seeds per scenario.'}
              </span>
            </div>
          </div>

          {done && simResult && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px',
                padding: '16px',
                borderRadius: '12px',
                background: '#0F1A2E',
                border: '1px solid #243350',
              }}
            >
              <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="lbl">Ambulance travel time</span>
                <span className="mono" style={{ fontSize: '24px', fontWeight: 600, color: '#34D3A8' }}>
                  {simResult.time_str}
                </span>
              </div>
              <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="lbl">Ambulance stops</span>
                <span className="mono" style={{ fontSize: '24px', fontWeight: 600 }}>
                  {simResult.stops}
                </span>
              </div>
              <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="lbl">Cross-traffic delay</span>
                <span className="mono" style={{ fontSize: '24px', fontWeight: 600 }}>
                  +{simResult.delay_percent}%
                </span>
              </div>
              {simResult.time_saved_pct !== undefined && (
                <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="lbl">Time saved vs baseline</span>
                  <span className="mono" style={{ fontSize: '24px', fontWeight: 600, color: '#34D3A8' }}>
                    {simResult.time_saved_pct}%
                  </span>
                </div>
              )}
              <div style={{ flex: '1 1 100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="chip c-green">Backend simulation complete</span>
                  {simResult.p_value && <span className="chip c-blue">p {simResult.p_value} · {simResult.seeds_run} seeds</span>}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('evaluation')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#34D3A8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  Compare all strategies →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Model Specs & Adapters */}
        <div style={{ flex: '2 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Corridor Model */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Network">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Corridor model</h2>
              <span className="chip c-gray">Sample data</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="lbl">Signalised junctions</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>4</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="lbl">Road source</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>OSM</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="lbl">Vehicle classes</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>5</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="lbl">Seeds per scenario</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>10</span>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#7F90AB', lineHeight: 1.5 }}>
              Cars, motorcycles, rickshaws, buses and trucks share the corridor. Calibrated against available observations, with the simulation-to-reality gap stated explicitly.
            </span>
          </section>

          {/* Adapters */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Adapters">
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Adapters</h2>
            {adapters.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 0',
                  borderTop: '1px solid #243350',
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '14px' }}>
                  <span style={{ fontWeight: 600 }}>{a.name}</span>
                  <span className="mono" style={{ fontSize: '12px', color: '#A3B2CA' }}>{a.iface}</span>
                </span>
                <span className={`chip ${a.cls}`}>{a.status}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
};
