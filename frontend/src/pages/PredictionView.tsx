import React, { useState } from 'react';

export const PredictionView: React.FC = () => {
  const [target, setTarget] = useState<'speed' | 'volume' | 'time'>('speed');
  const [hz, setHz] = useState<1 | 3 | 5>(3);

  const T: Record<string, { label: string; title: string; unit: string; min: number; max: number; f: (t: number) => number; noise: number }> = {
    speed: { label: 'Speed', title: 'Average speed (km/h)', unit: 'km/h', min: 10, max: 50, f: (t) => 31 + 7 * Math.sin(t / 3.2) - 0.18 * Math.max(0, t + 12), noise: 0.9 },
    volume: { label: 'Volume', title: 'Traffic volume (vehicles per minute)', unit: 'veh/min', min: 0, max: 40, f: (t) => 22 + 6 * Math.sin(t / 3.6 + 1) + 0.22 * Math.max(0, t + 12), noise: 1.1 },
    time: { label: 'Travel time', title: 'Segment travel time (minutes)', unit: 'min', min: 0, max: 10, f: (t) => 4.2 + 1.1 * Math.sin(t / 3.4 + 2) + 0.07 * Math.max(0, t + 12), noise: 0.18 }
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
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top 4 KPI Cards */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }} aria-label="Ambulance arrival prediction">
        <div className="card" style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Predicted arrival at hospital</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1, color: '#34D3A8' }}>07:00</span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>±0:25 interval · updated every 2 s</span>
        </div>

        <div className="card" style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Next junction (I1)</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1 }}>01:02</span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>queue forecast {Math.round(qn[0] * growth)} vehicles at arrival</span>
        </div>

        <div className="card" style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Forecast horizon</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1 }}>{hz} min</span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>1, 3 and 5 minute models</span>
        </div>

        <div className="card" style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Active model</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1 }}>XGBoost</span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>LSTM / GRU where enough data exists</span>
        </div>
      </section>

      {/* Forecast Chart */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Forecast chart">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{tg.title}</h2>
            <span className="chip c-gray">Sample data</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            {/* Target Select */}
            <div role="group" aria-label="Target" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(['speed', 'volume', 'time'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`btn-g ${target === k ? 'btn-on' : ''}`}
                  onClick={() => setTarget(k)}
                  aria-pressed={target === k}
                >
                  {T[k].label}
                </button>
              ))}
            </div>

            {/* Horizon Select */}
            <div role="group" aria-label="Horizon" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {([1, 3, 5] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`btn-g ${hz === h ? 'btn-on' : ''}`}
                  onClick={() => setHz(h)}
                  aria-pressed={hz === h}
                >
                  {h} min
                </button>
              ))}
            </div>
          </div>
        </div>

        <svg viewBox="0 0 800 300" style={{ width: '100%', height: 'auto' }} role="img" aria-label="Forecast chart">
          <g stroke="#243350" strokeWidth="1">
            <path d="M60 30H780M60 90H780M60 150H780M60 210H780M60 260H780" />
          </g>
          <g fontFamily="'IBM Plex Mono', monospace" fontSize="11" fill="#7F90AB" textAnchor="end">
            <text x="52" y="34">{ticks(tg.max)}</text>
            <text x="52" y="94">{ticks(tg.max - step)}</text>
            <text x="52" y="154">{ticks(tg.max - 2 * step)}</text>
            <text x="52" y="214">{ticks(tg.max - 3 * step)}</text>
            <text x="52" y="264">{ticks(tg.min)}</text>
          </g>
          <g fontFamily="'IBM Plex Mono', monospace" fontSize="11" fill="#7F90AB" textAnchor="middle">
            <text x="60" y="284" textAnchor="start">−20 min</text>
            <text x={nowX} y="284">now</text>
            <text x="780" y="284" textAnchor="end">+{hz} min</text>
          </g>
          <rect x={nowX} y="30" width={shift} height="230" fill="rgba(106,174,255,.08)" />
          <polygon points={upper.concat(lower).join(' ')} fill="rgba(52,211,168,.18)" />
          <polyline points={shiftedActual.join(' ')} fill="none" stroke="#E8EEF8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={pred.join(' ')} fill="none" stroke="#34D3A8" strokeWidth="3" strokeDasharray="7 6" strokeLinejoin="round" strokeLinecap="round" />
          <rect x={nowX} y="30" width="1.5" height="230" fill="#6AAEFF" />
          <g fontFamily="'IBM Plex Sans', sans-serif" fontSize="12" fontWeight="600">
            <text x={nowX + 6} y="24" fill="#6AAEFF">Forecast +{hz} min</text>
          </g>
        </svg>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '12px', color: '#A3B2CA' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '18px', height: '3px', background: '#E8EEF8' }}></span>Observed
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '18px', height: 0, borderTop: '3px dashed #34D3A8' }}></span>Predicted
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '18px', height: '10px', background: 'rgba(52,211,168,.3)' }}></span>Prediction interval
          </span>
        </div>
      </section>

      {/* Model Comparison & Queue Forecast */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        <section className="card" style={{ flex: '3 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Model comparison">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Model comparison on held-out data</h2>
            <span className="chip c-amber">Placeholder values</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Model</th><th>MAE</th><th>RMSE</th><th>Congestion accuracy</th><th></th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.name}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td className="mono">{m.mae}</td>
                    <td className="mono">{m.rmse}</td>
                    <td className="mono">{m.acc}</td>
                    <td><span className={`chip ${m.cls}`}>{m.tag}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={{ fontSize: '12px', color: '#7F90AB', lineHeight: 1.5 }}>
            Models grow in complexity and are always compared with simple baselines. Real figures replace these once experiments are run.
          </span>
        </section>

        <section className="card" style={{ flex: '2 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Queue forecast per junction">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Queue forecast by junction</h2>
          {qn.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
              <span style={{ width: '28px', fontWeight: 700 }}>I{i + 1}</span>
              <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: '#243350', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: '#34D3A8', width: `${Math.min(100, Math.round(n * growth * 6.5))}%` }}></div>
              </div>
              <span className="mono" style={{ width: '110px', textAlign: 'right', fontSize: '12px', color: '#A3B2CA' }}>
                {n} → <span style={{ color: '#E8EEF8' }}>{Math.round(n * growth + i * 0.4)}</span> veh
              </span>
            </div>
          ))}
          <span style={{ fontSize: '12px', color: '#7F90AB', lineHeight: 1.5 }}>
            Expected queue at each junction at the moment the ambulance arrives.
          </span>
        </section>
      </div>
    </main>
  );
};
