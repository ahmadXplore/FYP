import React, { useState } from 'react';
import { PageId } from '../components/Sidebar';
import { GitBranch, Clock, Sliders, CheckCircle2, ShieldCheck } from 'lucide-react';

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
    'Hold cross-arterial phase red; maintain clearance',
    'Shorten cross phase by 8 s; early green insertion',
    'Shorten cross phase by 6 s; coordinate approach',
    'Reserve green preemption slot; extend clearance'
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
      text: 'Standard cycle coordination. Arrival time slot reserved in background phase scheduler.',
      approach: '#D4351C', // Red stop
      cross: '#00703C',    // Cross moving
      north: '#00703C'
    },
    prep: {
      cls: 'c-amber',
      label: 'PREPARING',
      text: 'Cross-street green interval truncated early to dissipate vehicle queues ahead of emergency approach.',
      approach: '#D4351C',
      cross: '#F47738',
      north: '#F47738'
    },
    green: {
      cls: 'c-green',
      label: 'PRIORITY GREEN HOLD',
      text: 'Green wave priority actuated on ambulance approach. Conflicting movements red-locked with pedestrian protection.',
      approach: '#00703C',
      cross: '#D4351C',
      north: '#D4351C'
    },
    restoring: {
      cls: 'c-blue',
      label: 'RESTORING',
      text: 'Ambulance cleared detector loop. Local controller re-syncing phase offset.',
      approach: '#F47738',
      cross: '#D4351C',
      north: '#D4351C'
    },
    restored: {
      cls: 'c-blue',
      label: 'RESTORED',
      text: 'Normal coordinated arterial plan restored. Cycle deviation logged for audit.',
      approach: '#D4351C',
      cross: '#00703C',
      north: '#00703C'
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
        seg(0, prepStart, '#505A5F'),
        seg(prepStart, greenStart, '#F47738'),
        seg(greenStart, greenEnd, '#00703C'),
        seg(greenEnd, restoreEnd, '#1D70B8')
      ]
    };
  });

  const curStage = ST[stageOf(A[sel])];
  const scrubLeft = `calc(116px + (100% - 116px) * ${(T / MAX).toFixed(4)})`;

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Corridor Timeline Master Card */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Corridor Phase Preemption Timeline">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <span className="lbl">Multi-Intersection Wave Scheduling</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Corridor Phase Actuation Timeline
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '11px', color: 'var(--text)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#505A5F' }} />
              <span>Monitor</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#F47738' }} />
              <span>Queue Pre-Clearing</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#00703C' }} />
              <span>Priority Green Wave</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#1D70B8' }} />
              <span>Cycle Recovery</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '2px', height: '12px', background: 'var(--text)' }} />
              <span>Predicted Arrival</span>
            </span>
          </div>
        </div>

        {/* Visual Timeline Bar with Scrubber */}
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
              zIndex: 3,
            }}
          >
            <span
              className="mono"
              style={{
                background: 'var(--navy-800)',
                color: '#FFFFFF',
                border: '1px solid var(--accent-gold)',
                padding: '2px 8px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              T+{fmt(T)}
            </span>
          </div>

          {/* Scrubber Line */}
          <div
            style={{
              position: 'absolute',
              top: '32px',
              bottom: 0,
              width: '2px',
              background: 'var(--navy-800)',
              zIndex: 2,
              left: scrubLeft,
            }}
          />

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
                  color: 'var(--text-secondary)',
                  left: pct(m * 60),
                }}
              >
                {m}:00
              </span>
            ))}
          </div>

          {/* Intersection Rows (I1 - I4) */}
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '52px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ width: '116px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{r.id}</span>
                <span className={`chip ${r.cls}`} style={{ alignSelf: 'flex-start', height: '18px', padding: '0 6px', fontSize: '10px' }}>
                  {r.label}
                </span>
              </div>

              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  height: '24px',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
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
                  />
                ))}
                {/* Arrival Line Marker */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#FFFFFF',
                    borderRight: '1px solid #0B0C0C',
                    left: r.etaLeft,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Sliders Configuration */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', paddingTop: '8px' }}>
          <div style={{ flex: '2 1 260px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="scrub" className="lbl">
              Simulation Playback Elapsed Time: <span className="mono" style={{ color: 'var(--text)' }}>T+{fmt(T)}</span>
            </label>
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
          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="lead" className="lbl">
              Prepare Queue Lead Time: <span className="mono" style={{ color: 'var(--text)' }}>{lead} s</span>
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
          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="hold" className="lbl">
              Post-Passing Green Hold: <span className="mono" style={{ color: 'var(--text)' }}>{hold} s</span>
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

      {/* Plan Table & Intersection Signal Head Preview */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Intersection Plan Table */}
        <section
          className="card"
          style={{ flex: '3 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Intersection Signal Schedule Plan"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="lbl">Preemption Schedule Matrix</span>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                Signalized Intersection Execution Schedule
              </h2>
            </div>
            <span className="chip c-green">Safety Invariants Verified</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Junction</th>
                  <th>Predicted Arrival</th>
                  <th>Pre-Clear Time</th>
                  <th>Priority Window</th>
                  <th>Queue Estimate</th>
                  <th>Cross-Street Action</th>
                  <th>Safety Status</th>
                </tr>
              </thead>
              <tbody>
                {A.map((a, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontWeight: 700 }}>I{i + 1}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmt(a)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmt(a - lead)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmt(a - 15)} – {fmt(a + hold)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{queues[i]} veh</td>
                    <td style={{ fontSize: '13px' }}>{actions[i]}</td>
                    <td>
                      <span className="chip c-green" style={{ height: '20px', fontSize: '10px' }}>
                        APPROVED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Real-time 4-Way Intersection Signal Preview */}
        <section
          className="card"
          style={{ flex: '2 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Junction Signal Head Preview"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="lbl">Signal Head State</span>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                Junction View at T+{fmt(T)}
              </h2>
            </div>
          </div>

          {/* Node selector tabs */}
          <div role="group" aria-label="Select junction for signal head inspection" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {A.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`tab ${sel === i ? 'tab-on' : ''}`}
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
                style={{ minWidth: '50px', minHeight: '34px', padding: '0 12px', fontSize: '12px' }}
              >
                I{i + 1}
              </button>
            ))}
          </div>

          {/* 4-way intersection layout */}
          <div
            style={{
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--navy-50)',
              overflow: 'hidden',
              padding: '12px',
            }}
          >
            <svg
              viewBox="0 0 320 240"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="Four-way intersection schematic showing traffic light phases"
            >
              {/* Road surfaces */}
              <rect x="0" y="95" width="320" height="50" fill="var(--border-subtle)" />
              <rect x="135" y="0" width="50" height="240" fill="var(--border-subtle)" />

              {/* Dashed centerlines */}
              <g stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 6">
                <path d="M0 120H135M185 120H320M160 0V95M160 145V240" />
              </g>

              {/* Signal Head Markers */}
              <circle cx="206" cy="166" r="12" fill={curStage.approach} stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="114" cy="74" r="12" fill={curStage.north} stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="206" cy="74" r="12" fill={curStage.cross} stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="114" cy="166" r="12" fill={curStage.cross} stroke="#FFFFFF" strokeWidth="2" />

              {/* Ambulance vehicle approaching */}
              <g transform="translate(160 205)">
                <rect x="-12" y="-12" width="24" height="24" rx="2" fill="var(--danger)" stroke="#FFFFFF" strokeWidth="2" />
                <path d="M0 -6v12M-6 0h12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="square" />
              </g>

              {/* Approach Direction Labels */}
              <g fontFamily="'Public Sans', sans-serif" fontSize="10" fontWeight="700" fill="var(--text)">
                <text x="220" y="222">Ambulance Approach</text>
                <text x="14" y="88">Cross Arterial</text>
              </g>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className={`chip ${curStage.cls}`} style={{ alignSelf: 'flex-start' }}>
              I{sel + 1} · {curStage.label}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {curStage.text}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
};
