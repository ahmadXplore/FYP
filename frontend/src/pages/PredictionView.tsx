import React, { useState } from 'react';
import { TrendingUp, Clock, Layers, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export const PredictionView: React.FC = () => {
  const [target, setTarget] = useState<'speed' | 'volume' | 'time'>('speed');
  const [hz, setHz] = useState<1 | 3 | 5>(3);

  const T: Record<string, { label: string; title: string; unit: string; min: number; max: number; f: (t: number) => number; noise: number }> = {
    speed: { label: 'Speed', title: 'Average Corridor Speed (km/h)', unit: 'km/h', min: 10, max: 50, f: (t) => 31 + 7 * Math.sin(t / 3.2) - 0.18 * Math.max(0, t + 12), noise: 0.9 },
    volume: { label: 'Volume', title: 'Traffic Volume (vehicles per minute)', unit: 'veh/min', min: 0, max: 40, f: (t) => 22 + 6 * Math.sin(t / 3.6 + 1) + 0.22 * Math.max(0, t + 12), noise: 1.1 },
    time: { label: 'Travel Time', title: 'Segment Travel Time (minutes)', unit: 'min', min: 0, max: 10, f: (t) => 4.2 + 1.1 * Math.sin(t / 3.4 + 2) + 0.07 * Math.max(0, t + 12), noise: 0.18 }
  };

  const tg = T[target];
  const X0 = 60, X1 = 780, Y0 = 260, Y1 = 30;
  const shift = hz * 36;
  const nowX = X1 - shift;
  const px = (t: number) => X0 + (t + 20) / 20 * (nowX - X0);
  const py = (v: number) => Y0 - (Math.max(tg.min, Math.min(tg.max, v)) - tg.min) / (tg.max - tg.min) * (Y0 - Y1);
  const wob = (t: number, k: number) => Math.sin(t * 2.3 + k) * tg.noise;

  const shiftedActual: string[] = [];
  for (let t = -20; t <= 0; t += 1) {
    shiftedActual.push(px(t).toFixed(1) + ',' + py(tg.f(t) + wob(t, 0)).toFixed(1));
  }

  const pred: string[] = [];
  const upper: string[] = [];
  const lower: string[] = [];

  for (let i = 0; i <= hz * 4; i++) {
    const t = i / 4;
    const x = 780 - shift + (t / hz) * shift;
    const v = tg.f(t) + 0.4 * wob(t, 1.5);
    const w = tg.noise * (0.6 + t * 0.35);
    pred.push(x.toFixed(1) + ',' + py(v).toFixed(1));
    upper.push(x.toFixed(1) + ',' + py(v + w).toFixed(1));
    lower.unshift(x.toFixed(1) + ',' + py(v - w).toFixed(1));
  }

  const ticks = (v: number) => (tg.max <= 10 ? v.toFixed(1) : String(Math.round(v)));
  const step = (tg.max - tg.min) / 4;
  const qn = [6, 9, 7, 11];
  const growth = { 1: 1.05, 3: 1.2, 5: 1.35 }[hz];

  const models = [
    { name: 'Linear regression (baseline)', mae: '4.1', rmse: '5.6', acc: '71%', tag: 'BASELINE', cls: 'c-gray' },
    { name: 'Random forest (baseline)', mae: '3.2', rmse: '4.4', acc: '78%', tag: 'BASELINE', cls: 'c-gray' },
    { name: 'XGBoost / LightGBM', mae: '2.6', rmse: '3.6', acc: '84%', tag: 'ACTIVE', cls: 'c-green' },
    { name: 'LSTM / GRU', mae: '2.3', rmse: '3.3', acc: '86%', tag: 'EXPERIMENTAL', cls: 'c-blue' }
  ];

  return (
    <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top 4 KPI Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }} aria-label="Ambulance arrival prediction">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lbl" style={{ margin: 0 }}>Predicted ETA (Hospital)</span>
            <Clock size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1, color: 'var(--success)' }}>
            07:00
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            ±0:25 interval · updated every 2 s
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lbl" style={{ margin: 0 }}>Next Junction (I1) ETA</span>
            <TrendingUp size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1, color: 'var(--text)' }}>
            01:02
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Queue forecast: <strong style={{ color: 'var(--text)' }}>{Math.round(qn[0] * growth)}</strong> veh at arrival
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lbl" style={{ margin: 0 }}>Forecast Horizon</span>
            <Layers size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1, color: 'var(--text)' }}>
            {hz} min
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Evaluated against 1, 3 and 5 min horizons
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lbl" style={{ margin: 0 }}>Active Model</span>
            <Cpu size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <span className="mono" style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.2, color: 'var(--primary)' }}>
            XGBoost
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Auto-fallback to baseline if latency exceeds 200 ms
          </span>
        </div>
      </section>

      {/* Forecast Chart */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Forecast chart">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{tg.title}</h2>
            <span className="chip c-gray">Simulation Horizon</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            {/* Target Select */}
            <div role="group" aria-label="Target" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(['speed', 'volume', 'time'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`btn-g ${target === k ? 'btn-on' : ''}`}
                  onClick={() => setTarget(k)}
                  aria-pressed={target === k}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: target === k ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: target === k ? 'var(--navy-50)' : 'var(--surface)',
                    color: target === k ? 'var(--primary-active)' : 'var(--text)'
                  }}
                >
                  {T[k].label}
                </button>
              ))}
            </div>

            {/* Horizon Select */}
            <div role="group" aria-label="Horizon" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {([1, 3, 5] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`btn-g ${hz === h ? 'btn-on' : ''}`}
                  onClick={() => setHz(h)}
                  aria-pressed={hz === h}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: hz === h ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: hz === h ? 'var(--navy-50)' : 'var(--surface)',
                    color: hz === h ? 'var(--primary-active)' : 'var(--text)'
                  }}
                >
                  +{h} min
                </button>
              ))}
            </div>
          </div>
        </div>

        <svg viewBox="0 0 800 300" style={{ width: '100%', height: 'auto', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }} role="img" aria-label="Forecast chart">
          {/* Grid lines */}
          <g stroke="var(--border-subtle)" strokeWidth="1">
            <path d="M60 30H780M60 90H780M60 150H780M60 210H780M60 260H780" />
          </g>
          {/* Y-axis Ticks */}
          <g fontFamily="'IBM Plex Mono', monospace" fontSize="11" fill="var(--text-secondary)" textAnchor="end">
            <text x="52" y="34">{ticks(tg.max)}</text>
            <text x="52" y="94">{ticks(tg.max - step)}</text>
            <text x="52" y="154">{ticks(tg.max - 2 * step)}</text>
            <text x="52" y="214">{ticks(tg.max - 3 * step)}</text>
            <text x="52" y="264">{ticks(tg.min)}</text>
          </g>
          {/* X-axis Labels */}
          <g fontFamily="'IBM Plex Mono', monospace" fontSize="11" fill="var(--text-secondary)" textAnchor="middle">
            <text x="60" y="284" textAnchor="start">−20 min</text>
            <text x={nowX} y="284" fontWeight="600" fill="var(--text)">NOW (T=0)</text>
            <text x="780" y="284" textAnchor="end">+{hz} min</text>
          </g>
          {/* Forecast Horizon shaded zone */}
          <rect x={nowX} y="30" width={shift} height="230" fill="var(--navy-50)" opacity="0.6" />
          {/* Prediction Confidence Interval Band */}
          <polygon points={upper.concat(lower).join(' ')} fill="var(--primary)" opacity="0.15" />
          {/* Historical Observed Series */}
          <polyline points={shiftedActual.join(' ')} fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {/* Forecasted Prediction Line */}
          <polyline points={pred.join(' ')} fill="none" stroke="var(--success)" strokeWidth="3" strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />
          {/* Now Reference Marker */}
          <line x1={nowX} y1="30" x2={nowX} y2="260" stroke="var(--accent-gold)" strokeWidth="2" strokeDasharray="3 3" />
          <g fontFamily="'Public Sans', sans-serif" fontSize="11" fontWeight="600">
            <text x={nowX + 6} y="24" fill="var(--navy-800)">Forecast Window (+{hz} min)</text>
          </g>
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', height: '3px', background: 'var(--text)', borderRadius: '1px' }}></span>
            <strong style={{ color: 'var(--text)' }}>Observed</strong> (Historic Telemetry)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', height: 0, borderTop: '3px dashed var(--success)' }}></span>
            <strong style={{ color: 'var(--text)' }}>Predicted</strong> (T+{hz} min)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', height: '10px', background: 'var(--primary)', opacity: 0.25, borderRadius: '2px', border: '1px solid var(--primary)' }}></span>
            <strong style={{ color: 'var(--text)' }}>Confidence Interval</strong> (95%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--accent-gold)', borderRadius: '2px' }}></span>
            <strong style={{ color: 'var(--text)' }}>T=0 Boundary</strong>
          </span>
        </div>
      </section>

      {/* Model Comparison & Queue Forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Model comparison">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Model Benchmark Comparison (Held-Out Test Set)</h2>
            <span className="chip c-gray">K-Fold CV</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--navy-50)', borderBottom: '2px solid var(--border-strong)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)' }}>Model</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>MAE</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>RMSE</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>Accuracy</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)' }}>{m.name}</td>
                    <td className="mono" style={{ padding: '8px 10px', textAlign: 'right' }}>{m.mae}</td>
                    <td className="mono" style={{ padding: '8px 10px', textAlign: 'right' }}>{m.rmse}</td>
                    <td className="mono" style={{ padding: '8px 10px', textAlign: 'right' }}>{m.acc}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}><span className={`chip ${m.cls}`}>{m.tag}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Models grow in algorithmic complexity and are continuously verified against simple baselines to prevent over-fitting.
          </span>
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Queue forecast per junction">
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Corridor Junction Queue Forecast</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Projected queue length at ambulance arrival timestamp</span>
          </div>
          {qn.map((n, i) => {
            const projected = Math.round(n * growth + i * 0.4);
            const pct = Math.min(100, Math.round(n * growth * 6.5));
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Junction I-{i + 1}</span>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Initial: {n} → Projected: <strong style={{ color: 'var(--text)' }}>{projected} veh</strong>
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: projected > 12 ? 'var(--warning)' : 'var(--primary)',
                      width: `${pct}%`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--navy-50)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--navy-900)' }}>
            <CheckCircle2 size={16} strokeWidth={1.5} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span>All 4 junction queues remain within clearing limits before ambulance passage.</span>
          </div>
        </section>
      </div>
    </main>
  );
};