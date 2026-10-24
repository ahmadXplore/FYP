import React, { useState } from 'react';

export const PerceptionView: React.FC = () => {
  const [sel, setSel] = useState(1);
  const [boxes, setBoxes] = useState(true);
  const [zone, setZone] = useState(true);

  const L: Record<string, string> = { Light: 'c-green', Moderate: 'c-amber', Heavy: 'c-red' };
  const data = [
    { id: 'CAM-I1-S', name: 'Junction I1, south approach', count: 14, speed: 34, density: 38, queue: 22, level: 'Moderate' },
    { id: 'CAM-I2-S', name: 'Junction I2, south approach', count: 23, speed: 21, density: 61, queue: 48, level: 'Heavy' },
    { id: 'CAM-I3-W', name: 'Junction I3, west approach', count: 9, speed: 41, density: 24, queue: 10, level: 'Light' },
    { id: 'CAM-I4-S', name: 'Junction I4, south approach', count: 17, speed: 29, density: 44, queue: 31, level: 'Moderate' }
  ];

  const cur = data[sel];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Camera View Box */}
        <section className="card" style={{ flex: '3 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Camera view">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{cur.name}</h2>
              <span className="chip c-gray">Recorded footage (demo)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className={`btn-g ${boxes ? 'btn-on' : ''}`}
                onClick={() => setBoxes(!boxes)}
                aria-pressed={boxes}
              >
                Detections
              </button>
              <button
                type="button"
                className={`btn-g ${zone ? 'btn-on' : ''}`}
                onClick={() => setZone(!zone)}
                aria-pressed={zone}
              >
                Queue zone
              </button>
            </div>
          </div>

          <svg viewBox="0 0 800 450" style={{ width: '100%', height: 'auto', borderRadius: '10px', background: '#0A111F', border: '1px solid #1B2B46' }} role="img" aria-label="Camera view illustration">
            <polygon points="330,0 470,0 800,450 0,450" fill="#16233A" />
            <path d="M400 0L400 450" stroke="#2A3C5C" strokeWidth="3" strokeDasharray="22 18" />
            <path d="M365 0L255 450M435 0L545 450" stroke="#2A3C5C" strokeWidth="2" strokeDasharray="14 14" />

            {/* Queue zone */}
            {zone && (
              <g>
                <polygon points="250,450 350,230 450,230 550,450" fill="rgba(246,185,59,.16)" stroke="#F6B93B" strokeWidth="2" strokeDasharray="8 6" />
                <text x="400" y="222" textAnchor="middle" fontFamily="'IBM Plex Sans', sans-serif" fontSize="13" fontWeight="700" fill="#F6B93B">
                  Queue zone · {cur.queue} m
                </text>
              </g>
            )}

            {/* Detections */}
            {boxes && (
              <g fontFamily="'IBM Plex Mono', monospace" fontSize="11" fontWeight="600">
                <rect x="300" y="330" width="86" height="56" rx="6" fill="#6AAEFF" fillOpacity="0.35" /><rect x="300" y="330" width="86" height="56" rx="6" fill="none" stroke="#6AAEFF" strokeWidth="2" /><text x="304" y="324" fill="#6AAEFF">car #41</text>
                <rect x="420" y="360" width="90" height="62" rx="6" fill="#6AAEFF" fillOpacity="0.35" /><rect x="420" y="360" width="90" height="62" rx="6" fill="none" stroke="#6AAEFF" strokeWidth="2" /><text x="424" y="354" fill="#6AAEFF">car #44</text>
                <rect x="355" y="262" width="62" height="44" rx="6" fill="#34D3A8" fillOpacity="0.35" /><rect x="355" y="262" width="62" height="44" rx="6" fill="none" stroke="#34D3A8" strokeWidth="2" /><text x="359" y="256" fill="#34D3A8">bus #17</text>
                <rect x="440" y="276" width="34" height="30" rx="5" fill="#F6B93B" fillOpacity="0.35" /><rect x="440" y="276" width="34" height="30" rx="5" fill="none" stroke="#F6B93B" strokeWidth="2" /><text x="440" y="270" fill="#F6B93B">moto #52</text>
                <rect x="318" y="282" width="30" height="26" rx="5" fill="#F6B93B" fillOpacity="0.35" /><rect x="318" y="282" width="30" height="26" rx="5" fill="none" stroke="#F6B93B" strokeWidth="2" /><text x="296" y="278" fill="#F6B93B">rickshaw #38</text>
                <rect x="372" y="170" width="46" height="34" rx="5" fill="#A78BFA" fillOpacity="0.35" /><rect x="372" y="170" width="46" height="34" rx="5" fill="none" stroke="#A78BFA" strokeWidth="2" /><text x="372" y="164" fill="#A78BFA">truck #29</text>
                <rect x="388" y="112" width="30" height="24" rx="5" fill="#FF7A7A" fillOpacity="0.35" /><rect x="388" y="112" width="30" height="24" rx="5" fill="none" stroke="#FF7A7A" strokeWidth="2" /><text x="424" y="124" fill="#FF7A7A">ambulance #AMB-017</text>
              </g>
            )}

            <g fontFamily="'IBM Plex Mono', monospace" fontSize="12" fill="#A3B2CA">
              <text x="14" y="26">{cur.id}</text>
              <text x="14" y="44">homography calibrated</text>
            </g>
            <g transform="translate(770 22)"><circle r="6" fill="#FF7A7A" /></g>
            <text x="752" y="26" textAnchor="end" fontFamily="'IBM Plex Mono', monospace" fontSize="12" fill="#A3B2CA">REC</text>
          </svg>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#A3B2CA' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6AAEFF' }}></span>Car</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#34D3A8' }}></span>Bus</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F6B93B' }}></span>Motorcycle / rickshaw</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#A78BFA' }}></span>Truck</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FF7A7A' }}></span>Ambulance</span>
          </div>
        </section>

        {/* Cameras List */}
        <section className="card" style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Cameras">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Cameras on route</h2>
          <div role="group" aria-label="Choose camera" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.map((c, i) => {
              const on = sel === i;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`cam ${on ? 'cam-on' : ''}`}
                  onClick={() => setSel(i)}
                  aria-pressed={on}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{c.name.split(',')[0]}</span>
                    <span className={`chip ${L[c.level]}`}>{c.level.toUpperCase()}</span>
                  </span>
                  <span className="mono" style={{ fontSize: '12px', color: '#A3B2CA' }}>
                    {c.id} · {c.count} vehicles · {c.speed} km/h
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Traffic State Metrics */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }} aria-label="Traffic state">
        <div className="card" style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Vehicle count</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 600, lineHeight: 1 }}>{cur.count}</span>
          <span style={{ fontSize: '12px', color: '#A3B2CA' }}>in view, tracked with stable IDs</span>
        </div>

        <div className="card" style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Mean speed</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 600, lineHeight: 1 }}>
            {cur.speed} <span style={{ fontSize: '14px', color: '#A3B2CA' }}>km/h</span>
          </span>
          <span style={{ fontSize: '12px', color: '#A3B2CA' }}>pixels to metres via homography</span>
        </div>

        <div className="card" style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Density</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 600, lineHeight: 1 }}>
            {cur.density} <span style={{ fontSize: '14px', color: '#A3B2CA' }}>veh/km</span>
          </span>
          <span style={{ fontSize: '12px', color: '#A3B2CA' }}>per lane, current window</span>
        </div>

        <div className="card" style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Queue length</span>
          <span className="mono" style={{ fontSize: '30px', fontWeight: 600, lineHeight: 1 }}>
            {cur.queue} <span style={{ fontSize: '14px', color: '#A3B2CA' }}>m</span>
          </span>
          <span style={{ fontSize: '12px', color: '#A3B2CA' }}>on the ambulance approach</span>
        </div>

        <div className="card" style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Congestion class</span>
          <span style={{ paddingTop: '4px' }}>
            <span className={`chip ${L[cur.level]}`} style={{ height: '30px', fontSize: '13px' }}>
              {cur.level.toUpperCase()}
            </span>
          </span>
          <span style={{ fontSize: '12px', color: '#A3B2CA' }}>feeds routing and prediction</span>
        </div>
      </section>

      {/* Perception Pipeline */}
      <section className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }} aria-label="Pipeline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 340px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Perception pipeline</h2>
          <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.55 }}>
            If only processed detections are available, downstream modules consume them directly. Raw video stays on approved systems and is never sent to external services.
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ padding: '10px 14px', borderRadius: '10px', background: '#0F1A2E', border: '1px solid #243350' }}>YOLO detector</span>
          <span style={{ color: '#7F90AB' }} aria-hidden="true">→</span>
          <span style={{ padding: '10px 14px', borderRadius: '10px', background: '#0F1A2E', border: '1px solid #243350' }}>ByteTrack / BoT-SORT</span>
          <span style={{ color: '#7F90AB' }} aria-hidden="true">→</span>
          <span style={{ padding: '10px 14px', borderRadius: '10px', background: '#0F1A2E', border: '1px solid #243350' }}>Homography</span>
          <span style={{ color: '#7F90AB' }} aria-hidden="true">→</span>
          <span style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(52,211,168,.12)', border: '1px solid rgba(52,211,168,.4)', color: '#34D3A8' }}>
            Traffic state
          </span>
        </div>
      </section>
    </main>
  );
};
