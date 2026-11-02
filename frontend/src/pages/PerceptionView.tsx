import React, { useState } from 'react';
import { Video, Eye, ArrowRight, Camera, Shield } from 'lucide-react';

export const PerceptionView: React.FC = () => {
  const [sel, setSel] = useState(1);
  const [boxes, setBoxes] = useState(true);
  const [zone, setZone] = useState(true);

  const L: Record<string, string> = { Light: 'c-green', Moderate: 'c-amber', Heavy: 'c-red' };
  const data = [
    { id: 'CAM-I1-S', name: 'Junction I1, South Approach', count: 14, speed: 34, density: 38, queue: 22, level: 'Moderate' },
    { id: 'CAM-I2-S', name: 'Junction I2, South Approach', count: 23, speed: 21, density: 61, queue: 48, level: 'Heavy' },
    { id: 'CAM-I3-W', name: 'Junction I3, West Approach', count: 9, speed: 41, density: 24, queue: 10, level: 'Light' },
    { id: 'CAM-I4-S', name: 'Junction I4, South Approach', count: 17, speed: 29, density: 44, queue: 31, level: 'Moderate' }
  ];

  const cur = data[sel];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* CCTV Camera Stream Feed Box */}
        <section
          className="card"
          style={{ flex: '3 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="CCTV Video Perception Stream"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={18} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{cur.name}</h2>
              <span className="chip c-gray">PPIC3 Camera Feed #{cur.id}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className={`btn-g ${boxes ? 'btn-on' : ''}`}
                onClick={() => setBoxes(!boxes)}
                aria-pressed={boxes}
                style={{ padding: '0 10px', minHeight: '34px', fontSize: '12px' }}
              >
                Object Bounding Boxes
              </button>
              <button
                type="button"
                className={`btn-g ${zone ? 'btn-on' : ''}`}
                onClick={() => setZone(!zone)}
                aria-pressed={zone}
                style={{ padding: '0 10px', minHeight: '34px', fontSize: '12px' }}
              >
                Queue ROI Zone
              </button>
            </div>
          </div>

          {/* SVG Camera Perspective Representation */}
          <div
            style={{
              position: 'relative',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              background: 'var(--navy-50)',
            }}
          >
            <svg
              viewBox="0 0 800 450"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="Perspective CCTV view showing tracked vehicles and queue extraction"
            >
              {/* Road perspective polygon */}
              <polygon points="330,0 470,0 800,450 0,450" fill="var(--border-subtle)" />
              <path d="M400 0L400 450" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="22 18" opacity="0.9" />
              <path d="M365 0L255 450M435 0L545 450" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="14 14" opacity="0.6" />

              {/* Queue measurement ROI zone */}
              {zone && (
                <g>
                  <polygon
                    points="250,450 350,230 450,230 550,450"
                    fill="rgba(244, 119, 56, 0.12)"
                    stroke="var(--warning)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <rect x="300" y="206" width="200" height="22" rx="2" fill="var(--surface)" stroke="var(--warning)" strokeWidth="1" />
                  <text
                    x="400"
                    y="221"
                    textAnchor="middle"
                    fontFamily="'Public Sans', sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--warning)"
                  >
                    QUEUE EXTRACTION ROI · {cur.queue} m
                  </text>
                </g>
              )}

              {/* Detection bounding boxes (High contrast, no glow, clean borders) */}
              {boxes && (
                <g fontFamily="'IBM Plex Mono', monospace" fontSize="11" fontWeight="600">
                  {/* Car #41 */}
                  <rect x="300" y="330" width="86" height="56" rx="2" fill="rgba(29, 112, 184, 0.15)" stroke="var(--primary)" strokeWidth="2" />
                  <rect x="300" y="316" width="60" height="15" rx="1" fill="var(--primary)" />
                  <text x="304" y="327" fill="#FFFFFF" fontSize="10">car #41</text>

                  {/* Car #44 */}
                  <rect x="420" y="360" width="90" height="62" rx="2" fill="rgba(29, 112, 184, 0.15)" stroke="var(--primary)" strokeWidth="2" />
                  <rect x="420" y="346" width="60" height="15" rx="1" fill="var(--primary)" />
                  <text x="424" y="357" fill="#FFFFFF" fontSize="10">car #44</text>

                  {/* Bus #17 */}
                  <rect x="355" y="262" width="62" height="44" rx="2" fill="rgba(0, 112, 60, 0.15)" stroke="var(--success)" strokeWidth="2" />
                  <rect x="355" y="248" width="60" height="15" rx="1" fill="var(--success)" />
                  <text x="359" y="259" fill="#FFFFFF" fontSize="10">bus #17</text>

                  {/* Moto #52 */}
                  <rect x="440" y="276" width="36" height="30" rx="2" fill="rgba(244, 119, 56, 0.15)" stroke="var(--warning)" strokeWidth="2" />
                  <rect x="440" y="262" width="58" height="15" rx="1" fill="var(--warning)" />
                  <text x="444" y="273" fill="#FFFFFF" fontSize="10">moto #52</text>

                  {/* Rickshaw #38 */}
                  <rect x="318" y="282" width="32" height="26" rx="2" fill="rgba(244, 119, 56, 0.15)" stroke="var(--warning)" strokeWidth="2" />
                  <rect x="294" y="268" width="56" height="15" rx="1" fill="var(--warning)" />
                  <text x="296" y="279" fill="#FFFFFF" fontSize="10">auto #38</text>

                  {/* Truck #29 */}
                  <rect x="372" y="170" width="46" height="34" rx="2" fill="rgba(62, 100, 152, 0.15)" stroke="var(--navy-600)" strokeWidth="2" />
                  <rect x="372" y="156" width="68" height="15" rx="1" fill="var(--navy-600)" />
                  <text x="376" y="167" fill="#FFFFFF" fontSize="10">truck #29</text>

                  {/* Emergency Vehicle Unit AMB-017 */}
                  <rect x="388" y="112" width="34" height="26" rx="2" fill="rgba(212, 53, 28, 0.15)" stroke="var(--danger)" strokeWidth="2.5" />
                  <rect x="424" y="112" width="115" height="18" rx="1" fill="var(--danger)" />
                  <text x="428" y="125" fill="#FFFFFF" fontSize="10">AMB-017 (PRIORITY)</text>
                </g>
              )}

              {/* Homography telemetry overlay */}
              <rect x="10" y="10" width="170" height="42" rx="2" fill="var(--surface)" stroke="var(--border-subtle)" strokeWidth="1" />
              <text x="20" y="27" fontFamily="'IBM Plex Mono', monospace" fontSize="11" fontWeight="700" fill="var(--text)">
                {cur.id} · ONLINE
              </text>
              <text x="20" y="42" fontFamily="'Public Sans', sans-serif" fontSize="10" fill="var(--text-secondary)">
                Homography Matrix Calibrated
              </text>

              {/* Live recording indicator */}
              <g transform="translate(740 24)">
                <circle r="4" fill="var(--danger)" />
                <text x="-8" y="4" textAnchor="end" fontFamily="'IBM Plex Mono', monospace" fontSize="11" fontWeight="700" fill="var(--text)">
                  REC
                </text>
              </g>
            </svg>
          </div>

          {/* Color-blind safe category legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: 'var(--text)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '1px', background: 'var(--primary)' }} />
              Passenger Car
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '1px', background: 'var(--success)' }} />
              Transit Bus
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '1px', background: 'var(--warning)' }} />
              Motorcycle / Auto-Rickshaw
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '1px', background: 'var(--navy-600)' }} />
              Heavy Goods Vehicle
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '1px', background: 'var(--danger)' }} />
              Emergency Ambulance (Priority)
            </span>
          </div>
        </section>

        {/* Camera List on Corridor */}
        <section
          className="card"
          style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Cameras on Route"
        >
          <div>
            <span className="lbl">Perception Network</span>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
              Corridor Camera Feeds
            </h2>
          </div>

          <div role="group" aria-label="Select camera feed" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.map((c, i) => {
              const on = sel === i;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`cam ${on ? 'cam-on' : ''}`}
                  onClick={() => setSel(i)}
                  aria-pressed={on}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '4px',
                    borderLeft: on ? '3px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      {c.name.split(',')[0]}
                    </span>
                    <span className={`chip ${L[c.level]}`}>{c.level.toUpperCase()}</span>
                  </div>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {c.id} · {c.count} vehicles · {c.speed} km/h
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Traffic State Metrics (KPI Row) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }} aria-label="Extracted Traffic Metrics">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Vehicle Count</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1 }}>{cur.count}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tracked with persistent ByteTrack IDs</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Mean Approach Speed</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1 }}>
            {cur.speed} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>km/h</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Metric transformation via homography</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Traffic Density</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1 }}>
            {cur.density} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>veh/km</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Per lane within current sliding window</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Approach Queue Length</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1 }}>
            {cur.queue} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>m</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Directly feeds queue pre-clearing model</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Congestion Severity</span>
          <div style={{ paddingTop: '2px' }}>
            <span className={`chip ${L[cur.level]}`} style={{ height: '28px', fontSize: '12px' }}>
              {cur.level.toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dynamic input to A* edge weights</span>
        </div>
      </section>

      {/* Perception Pipeline Architecture Diagram (Clean, flat boxes, thin lines, no glow) */}
      <section
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        aria-label="Computer Vision Perception Pipeline Architecture"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 320px' }}>
          <span className="lbl">Edge Vision Processing</span>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
            Automated Traffic Feature Extraction Architecture
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Surveillance footage is processed on isolated edge nodes. Raw video never egresses PPIC3 boundaries;
            only sanitized numeric telemetry (vehicle count, speed, and queue length) is fed to the corridor engine.
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>
          <div style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
            YOLOv8 Edge Detector
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
          <div style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
            ByteTrack Multi-Object Filter
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
          <div style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
            Planar Homography Mapper
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
          <div style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--navy-50)', border: '1px solid var(--primary)', color: 'var(--navy-800)' }}>
            Calibrated Traffic State
          </div>
        </div>
      </section>
    </main>
  );
};
