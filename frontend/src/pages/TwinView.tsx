import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Sidebar';
import { apiService, SimulationResult } from '../services/api';
import { Play, RotateCcw, Lock, CheckCircle2, AlertTriangle, Cpu, Layers, ArrowRight, ShieldCheck } from 'lucide-react';

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

  const SC = [
    { id: 'off', name: 'Off-Peak', desc: 'Light traffic baseline (600 veh/hr)', base: 360, stops: 3 },
    { id: 'peak', name: 'Peak Hour', desc: 'Dense mixed urban flow (1,800 veh/hr)', base: 600, stops: 6 },
    { id: 'inc', name: 'Incident Scenario', desc: 'Blocked lane at downstream node', base: 720, stops: 8 }
  ];

  const ST = [
    { id: 'A', name: 'Fixed-Time Baseline', f: 1.0, stopF: 1, delay: 0 },
    { id: 'B', name: 'Reactive Preemption', f: 0.9, stopF: 0.7, delay: 9 },
    { id: 'C', name: 'Traffic-Aware Routing Only', f: 0.84, stopF: 0.8, delay: 2 },
    { id: 'D', name: 'Dynamic Green Corridor', f: 0.74, stopF: 0.4, delay: 7 },
    { id: 'E', name: 'Predictive Green Corridor', f: 0.67, stopF: 0.25, delay: 5 },
    { id: 'F', name: 'PPO Reinforcement Learning', f: 0.63, stopF: 0.2, delay: 4 }
  ];

  const adapters = [
    { name: 'Traffic Data Provider: Simulation', iface: 'TrafficDataProvider (TraCI)', status: 'ACTIVE', cls: 'c-green' },
    { name: 'Signal Controller: SUMO Micro-Sim', iface: 'SignalController (TraCI Protocol)', status: 'ACTIVE', cls: 'c-green' },
    { name: 'Traffic Data Provider: PSCA PPIC3', iface: 'TrafficDataProvider (Secure API Gateway)', status: 'NOT CONNECTED', cls: 'c-gray' },
    { name: 'Signal Controller: PSCA PTSC Live', iface: 'SignalController (Sandbox Stage)', status: 'RESTRICTED', cls: 'c-gray' }
  ];

  const handleRun = async () => {
    setP(0);
    setDone(false);
    setSimResult(null);
    setRunning(true);
    const result = await apiService.runSimulation(scenario, strategy);
    setSimResult(result);
    setRunning(false);
    setP(1);
    setDone(true);
  };

  return (
    <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Operating Mode Selector */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Operating mode">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)' }}>Digital Twin Operating Mode</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hardware-in-the-loop and software simulation adapters</span>
          </div>
          <span className="chip c-blue">Architecture Layer 1</span>
        </div>

        <div role="group" aria-label="Mode" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <button
            type="button"
            className="pick pick-on"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '14px',
              textAlign: 'left',
              borderRadius: '4px',
              border: '2px solid var(--primary)',
              background: 'var(--navy-50)',
              cursor: 'default'
            }}
            aria-pressed="true"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy-900)' }}>
                Mode 2 · Digital Twin / Simulation
              </span>
              <span className="chip c-green">ACTIVE</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Recorded road observations and synthetic flows calibrate the SUMO network. The AI controller drives simulated signals through TraCI socket protocol.
            </span>
          </button>

          <button
            type="button"
            className="pick"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '14px',
              textAlign: 'left',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer'
            }}
            onClick={() => setLock(true)}
            aria-pressed="false"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                <Lock size={15} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
                Mode 1 · PSCA Live Integration
              </span>
              <span className="chip c-gray">RESTRICTED</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Production telemetry and signal preemption via PSCA SCATS/PTSC interface. Requires physical control-room authorization and staging validation.
            </span>
          </button>
        </div>

        {lock && (
          <div
            role="status"
            style={{
              padding: '12px 16px',
              borderRadius: '4px',
              background: 'var(--surface)',
              border: '1px solid var(--warning)',
              borderLeft: '4px solid var(--warning)',
              fontSize: '13px',
              lineHeight: 1.5,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertTriangle size={18} strokeWidth={1.5} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', color: 'var(--navy-900)' }}>Mode 1 Staging Lock Active</strong>
              Live PSCA PTSC connection requires formal operational sign-off and mutual TLS certificates. The system operates in Digital Twin simulation mode. Seamless adapter design allows swapping to live feed with zero core codebase alterations.
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: Simulation & Model */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Run a simulation */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Run a simulation">
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)' }}>Execute Controlled Experiment</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Evaluate corridor policies across stochastic multi-seed runs</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="lbl" id="sc-l" style={{ margin: 0, fontWeight: 600 }}>Traffic Scenario</label>
            <div role="group" aria-labelledby="sc-l" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {SC.map((s) => {
                const on = scenario === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    style={{
                      padding: '10px',
                      borderRadius: '4px',
                      textAlign: 'left',
                      border: on ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: on ? 'var(--navy-50)' : 'var(--surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onClick={() => {
                      setScenario(s.id);
                      setDone(false);
                      setP(0);
                    }}
                    aria-pressed={on}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', color: on ? 'var(--navy-900)' : 'var(--text)' }}>
                      {s.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {s.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="lbl" id="st-l" style={{ margin: 0, fontWeight: 600 }}>Control Strategy</label>
            <div role="group" aria-labelledby="st-l" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
              {ST.map((t) => {
                const on = strategy === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      textAlign: 'left',
                      border: on ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: on ? 'var(--navy-50)' : 'var(--surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => {
                      setStrategy(t.id);
                      setDone(false);
                      setP(0);
                    }}
                    aria-pressed={on}
                  >
                    <span className="mono" style={{ fontWeight: 700, color: on ? 'var(--primary-active)' : 'var(--text)', background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border-subtle)' }}>
                      {t.id}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: on ? 700 : 500, color: on ? 'var(--navy-900)' : 'var(--text)' }}>
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn-p"
              onClick={handleRun}
              disabled={running}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '4px',
                background: 'var(--primary)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: running ? 'not-allowed' : 'pointer'
              }}
            >
              {running ? (
                <>
                  <RotateCcw size={16} strokeWidth={1.5} className="spin" />
                  Running TraCI...
                </>
              ) : done ? (
                <>
                  <RotateCcw size={16} strokeWidth={1.5} />
                  Re-Run Simulation
                </>
              ) : (
                <>
                  <Play size={16} strokeWidth={1.5} />
                  Execute Simulation
                </>
              )}
            </button>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ height: '8px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--primary)',
                    width: `${Math.round(p * 100)}%`,
                    transition: 'width 0.15s ease'
                  }}
                />
              </div>
              <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {running
                  ? `Simulating seed ${Math.round(p * 10)} of 10...`
                  : done
                  ? 'Completed: 10 of 10 stochastic seeds'
                  : 'Ready: 10 seeds per scenario evaluation'}
              </span>
            </div>
          </div>

          {done && simResult && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                padding: '16px',
                borderRadius: '4px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)',
                marginTop: '8px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="lbl" style={{ margin: 0 }}>Ambulance Travel Time</span>
                <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>
                  {simResult.time_str}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="lbl" style={{ margin: 0 }}>Ambulance Stops</span>
                <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                  {simResult.stops}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="lbl" style={{ margin: 0 }}>Cross-Traffic Delay</span>
                <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                  +{simResult.delay_percent}%
                </span>
              </div>
              {simResult.time_saved_pct !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="lbl" style={{ margin: 0 }}>Time Reduction</span>
                  <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>
                    {simResult.time_saved_pct}%
                  </span>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="chip c-green">Micro-Simulation Complete</span>
                  {simResult.p_value && <span className="chip c-blue">p = {simResult.p_value} · {simResult.seeds_run} seeds</span>}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('evaluation')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  View Full Evaluation Matrix <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Model Specs & Adapters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Corridor Model */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Network specification">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Corridor Model Topology</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ferozepur Road corridor simulation parameters</span>
              </div>
              <span className="chip c-gray">SUMO v1.20</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'var(--surface-alt)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <span className="lbl" style={{ margin: 0 }}>Signalised Nodes</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', display: 'block' }}>4</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--surface-alt)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <span className="lbl" style={{ margin: 0 }}>Network Geometry</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', display: 'block' }}>OSM Lahore</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--surface-alt)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <span className="lbl" style={{ margin: 0 }}>Vehicle Classes</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', display: 'block' }}>5 Modes</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--surface-alt)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <span className="lbl" style={{ margin: 0 }}>Evaluation Seeds</span>
                <span className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', display: 'block' }}>10 Seeds</span>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Mixed urban traffic calibrated with cars, motorcycles, auto-rickshaws, transit buses and emergency vehicles. Sim-to-real gap is explicitly bounded in the thesis report.
            </span>
          </section>

          {/* Adapters */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="System adapters">
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Interface Adapters</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pluggable data provider and signal preemption bindings</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {adapters.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: i < adapters.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{a.name}</span>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.iface}</span>
                  </div>
                  <span className={`chip ${a.cls}`}>{a.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};