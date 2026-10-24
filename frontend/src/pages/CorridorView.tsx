import React, { useState } from 'react';
import { PageId } from '../components/Sidebar';

interface CorridorViewProps {
  onNavigate: (page: PageId) => void;
}

export const CorridorView: React.FC<CorridorViewProps> = () => {
  const [T, setT] = useState(70);
  const [lead, setLead] = useState(40);
  const [hold, setHold] = useState(10);
  const [sel, setSel] = useState(1);

  const MAX = 440;
  const fmt = (sec: number) => {
    const s = Math.round(Math.max(0, sec));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const pct = (v: number) => (Math.max(0, Math.min(MAX, v)) / MAX * 100).toFixed(2) + '%';

  const A = [62, 175, 284, 389];
  const queues = [6, 9, 7, 11];
  const actions = [
    'Hold cross phase red',
    'Shorten cross phase by 8 s',
    'Shorten cross phase by 6 s',
    'Reserve slot, extend clearance'
  ];

  const stageOf = (a: number) => {
    const prepStart = a - lead;
    const greenStart = a - 15;
    const greenEnd = a + hold;
    const restoreEnd = greenEnd + 15;
    if (T < prepStart) return 'monitor';
    if (T < greenStart) return 'prep';
    if (T < greenEnd) return 'green';
    if (T < restoreEnd) return 'restoring';
    return 'restored';
  };

  const ST: Record<string, { cls: string; label: string; text: string; approach: string; cross: string; north: string }> = {
    monitor: {
      cls: 'c-gray',
      label: 'MONITOR',
      text: 'Normal cycle. A green slot is reserved for the predicted arrival time.',
      approach: '#FF7A7A',
      cross: '#34D3A8',
      north: '#34D3A8'
    },
    prep: {
      cls: 'c-amber',
      label: 'PREPARING',
      text: 'The cross-street phase is being shortened so the queue on the ambulance approach clears before arrival.',
      approach: '#FF7A7A',
      cross: '#F6B93B',
      north: '#F6B93B'
    },
    green: {
      cls: 'c-green',
      label: 'GREEN HOLD',
      text: 'Green priority on the ambulance approach. Conflicting phases are red and pedestrians are protected.',
      approach: '#34D3A8',
      cross: '#FF7A7A',
      north: '#FF7A7A'
    },
    restoring: {
      cls: 'c-blue',
      label: 'RESTORING',
      text: 'Ambulance has passed. The signal is rejoining its regular cycle.',
      approach: '#F6B93B',
      cross: '#FF7A7A',
      north: '#FF7A7A'
    },
    restored: {
      cls: 'c-blue',
      label: 'RESTORED',
      text: 'Back on the normal signal plan. Recovery time is logged.',
      approach: '#FF7A7A',
      cross: '#34D3A8',
      north: '#34D3A8'
    }
  };

  const rows = A.map((a, i) => {
    const prepStart = Math.max(0, a - lead);
    const greenStart = a - 15;
    const greenEnd = a + hold;
    const restoreEnd = greenEnd + 15;
    const seg = (from: number, to: number, color: string) => ({
      left: pct(from),
      w: (Math.max(0, to - from) / MAX * 100).toFixed(2) + '%',
      color
    });
    const st = ST[stageOf(a)];
    return {
      id: 'I' + (i + 1),
      cls: st.cls,
      label: st.label,
      etaLeft: pct(a),
      segs: [
        seg(0, prepStart, '#7F90AB'),
        seg(prepStart, greenStart, '#F6B93B'),
        seg(greenStart, greenEnd, '#34D3A8'),
        seg(greenEnd, restoreEnd, '#6AAEFF')
      ]
    };
  });

  const curStage = ST[stageOf(A[sel])];
  const scrubLeft = `calc(116px + (100% - 116px) * ${(T / MAX).toFixed(4)})`;

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Corridor Timeline */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} aria-label="Corridor timeline">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Corridor timeline</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#A3B2CA' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#7F90AB' }}></span>Monitor
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F6B93B' }}></span>Prepare
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#34D3A8' }}></span>Green hold
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6AAEFF' }}></span>Restore
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '3px', height: '12px', background: '#E8EEF8' }}></span>Ambulance arrival
            </span>
          </div>
        </div>

        {/* Visual Timeline Bar */}
        <div style={{ position: 'relative', paddingTop: '34px' }}>
          {/* Scrubber Badge */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'translateX(-50%)',
              left: scrubLeft,
            }}
          >
            <span className="chip c-gray mono" style={{ background: '#E8EEF8', color: '#0B1220', borderColor: '#E8EEF8' }}>
              T+{fmt(T)}
            </span>
          </div>

          {/* Scrubber Line */}
          <div
            style={{
              position: 'absolute',
              top: '34px',
              bottom: 0,
              width: '2px',
              background: '#E8EEF8',
              opacity: 0.85,
              zIndex: 2,
              left: scrubLeft,
            }}
          ></div>

          {/* Time Ticks */}
          <div style={{ marginLeft: '116px', position: 'relative', height: '22px' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((m) => (
              <span
                key={m}
                className="mono"
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#7F90AB',
                  left: pct(m * 60),
                }}
              >
                {m}:00
              </span>
            ))}
          </div>

          {/* Rows for I1 - I4 */}
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '54px',
                borderTop: '1px solid #243350',
              }}
            >
              <div style={{ width: '116px', flex: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{r.id}</span>
                <span className={`chip ${r.cls}`} style={{ alignSelf: 'flex-start', height: '20px', padding: '0 8px', fontSize: '10px' }}>
                  {r.label}
                </span>
              </div>

              <div style={{ position: 'relative', flex: 1, height: '28px', borderRadius: '8px', overflow: 'hidden', background: '#0F1A2E' }}>
                {r.segs.map((sg, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      background: sg.color,
                      left: sg.left,
                      width: sg.w,
                    }}
                  ></div>
                ))}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    background: '#E8EEF8',
                    left: r.etaLeft,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-end', paddingTop: '6px' }}>
          <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="scrub" className="lbl">Scrub time since dispatch</label>
            <input
              id="scrub"
              type="range"
              min="0"
              max="420"
              step="1"
              value={T}
              onChange={(e) => setT(Number(e.target.value))}
            />
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="lead" className="lbl">
              Prepare lead time: <span className="mono" style={{ color: '#E8EEF8' }}>{lead} s</span>
            </label>
            <input
              id="lead"
              type="range"
              min="20"
              max="90"
              step="5"
              value={lead}
              onChange={(e) => setLead(Number(e.target.value))}
            />
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="hold" className="lbl">
              Hold after passing: <span className="mono" style={{ color: '#E8EEF8' }}>{hold} s</span>
            </label>
            <input
              id="hold"
              type="range"
              min="0"
              max="20"
              step="2"
              value={hold}
              onChange={(e) => setHold(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Plan Table & Signal Preview */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Intersection Plan */}
        <section className="card" style={{ flex: '3 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Intersection plan">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Intersection plan</h2>
            <span className="chip c-gray">Sample data</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Junction</th>
                  <th>Arrival</th>
                  <th>Prepare at</th>
                  <th>Green</th>
                  <th>Predicted queue</th>
                  <th>Cross-street action</th>
                  <th>Safety</th>
                </tr>
              </thead>
              <tbody>
                {A.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>I{i + 1}</td>
                    <td className="mono">{fmt(a)}</td>
                    <td className="mono">{fmt(a - lead)}</td>
                    <td className="mono">{fmt(a - 15)} – {fmt(a + hold)}</td>
                    <td className="mono">{queues[i]} veh</td>
                    <td>{actions[i]}</td>
                    <td><span className="chip c-green">VALIDATED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Signal Preview */}
        <section className="card" style={{ flex: '2 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Signal preview">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Signal preview at T+{fmt(T)}</h2>
          <div role="group" aria-label="Choose junction" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {A.map((a, i) => (
              <button
                key={i}
                type="button"
                className={`tab ${sel === i ? 'tab-on' : ''}`}
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
                style={{ minWidth: '56px', padding: '0 16px' }}
              >
                I{i + 1}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 320 240" style={{ width: '100%', height: 'auto', borderRadius: '10px', background: '#0D1627', border: '1px solid #1B2B46' }} role="img" aria-label="Four-way intersection view">
            <rect x="0" y="95" width="320" height="50" fill="#1B2B46" />
            <rect x="135" y="0" width="50" height="240" fill="#1B2B46" />
            <g stroke="#0D1627" strokeWidth="1.5" strokeDasharray="8 8">
              <path d="M0 120H135M185 120H320M160 0V95M160 145V240" />
            </g>
            <circle cx="206" cy="166" r="12" fill={curStage.approach} stroke="#0D1627" strokeWidth="3" />
            <circle cx="114" cy="74" r="12" fill={curStage.north} stroke="#0D1627" strokeWidth="3" />
            <circle cx="206" cy="74" r="12" fill={curStage.cross} stroke="#0D1627" strokeWidth="3" />
            <circle cx="114" cy="166" r="12" fill={curStage.cross} stroke="#0D1627" strokeWidth="3" />
            <g transform="translate(160 205)">
              <rect x="-12" y="-12" width="24" height="24" rx="7" fill="#FFFFFF" stroke="#FF7A7A" strokeWidth="2" />
              <path d="M0 -5v10M-5 0h10" stroke="#E5484D" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g fontFamily="'IBM Plex Sans', sans-serif" fontSize="11" fontWeight="600" fill="#A3B2CA">
              <text x="196" y="226">Ambulance approach</text>
              <text x="12" y="88">Cross street</text>
            </g>
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className={`chip ${curStage.cls}`} style={{ alignSelf: 'flex-start' }}>
              I{sel + 1} · {curStage.label}
            </span>
            <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.5 }}>
              {curStage.text}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
};
