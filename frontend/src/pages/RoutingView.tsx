import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Sidebar';
import { apiService } from '../services/api';

interface RoutingViewProps {
  onNavigate: (page: PageId) => void;
}

export const RoutingView: React.FC<RoutingViewProps> = ({ onNavigate }) => {
  const [selId, setSelId] = useState('jinnah');
  const [incidentActive, setIncidentActive] = useState(false);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const ROUTE_POINTS: Record<string, { aware: string; shortPts: string }> = {
    jinnah: { aware: '70,440 230,440 400,440 400,320 400,200 560,200 720,200 720,90 800,90', shortPts: '70,440 70,90 800,90' },
    services: { aware: '70,440 230,440 400,440 560,440 560,320', shortPts: '70,440 230,440 230,320 400,320 560,320' },
    mayo: { aware: '70,440 230,440 230,320 230,200 230,90', shortPts: '70,440 230,440 230,320 230,200 230,90' },
  };

  const DEFAULT_H = [
    { id: 'jinnah', name: 'Jinnah Hospital', dist: '5.3', tags: 'Cardiac · Trauma', cap: 'ER beds available', capCls: 'c-green', travel: 340, cong: 45, signal: 35, short: 530, rank: 1, insight: 'Longer on the map but faster in time: the traffic-aware route avoids the congested western approach.' },
    { id: 'services', name: 'Services Hospital', dist: '4.8', tags: 'Cardiac', cap: 'ER beds limited', capCls: 'c-amber', travel: 380, cong: 60, signal: 65, short: 545, rank: 2, insight: 'The direct road crosses a congested segment, so the route stays on the southern arterial.' },
    { id: 'mayo', name: 'Mayo Hospital', dist: '4.1', tags: 'Trauma · Neurology', cap: 'ER beds available', capCls: 'c-green', travel: 300, cong: 190, signal: 90, short: 580, rank: 3, insight: 'Nearest by distance but slowest in time. Both routes are the same here, and the congestion penalty dominates.' },
  ].map((h) => ({ ...h, total: h.travel + h.cong + h.signal }));

  const [H, setH] = useState(DEFAULT_H);

  useEffect(() => {
    const fetchRouting = async () => {
      const res = await apiService.getRouting();
      if (res && res.hospitals) {
        setIncidentActive(!!res.incident_active);
        const mapped = res.hospitals.map((h: any) => ({
          id: h.id,
          name: h.name,
          dist: String(h.dist),
          tags: h.tags,
          cap: h.cap,
          capCls: h.cap_cls,
          travel: h.travel_time_sec,
          cong: h.cong_penalty_sec,
          signal: h.signal_delay_sec,
          short: h.short_dist_sec,
          rank: h.rank,
          insight: h.insight,
          total: h.total_sec,
        }));
        setH(mapped);
      }
    };
    fetchRouting();
  }, []);

  const cur = H.find((h) => h.id === selId) || H[0];
  const curRoutePoints = ROUTE_POINTS[cur.id] || ROUTE_POINTS['jinnah'];
  const gain = cur.short - cur.total;
  const sameRoute = cur.id === 'mayo';

  const costs = [
    { label: 'Travel time', value: fmt(cur.travel), color: '#6AAEFF', w: (cur.travel / cur.total * 100).toFixed(1) + '%' },
    { label: 'Congestion penalty', value: fmt(cur.cong), color: '#F6B93B', w: (cur.cong / cur.total * 100).toFixed(1) + '%' },
    { label: 'Signal delay', value: fmt(cur.signal), color: '#A78BFA', w: (cur.signal / cur.total * 100).toFixed(1) + '%' }
  ];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Hospital Ranking */}
        <section className="card" style={{ flex: '2 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Hospital ranking">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Hospital ranking</h2>
            <span className="chip c-gray">EM-0412 · P1</span>
          </div>

          <div role="group" aria-label="Choose hospital" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {H.map((h) => {
              const on = selId === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  className={`pick ${on ? 'pick-on' : ''}`}
                  onClick={() => setSelId(h.id)}
                  aria-pressed={on}
                  style={{ gap: '14px', padding: '14px 16px', borderRadius: '12px' }}
                >
                  <span
                    className="mono"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      flex: 'none',
                      background: h.rank === 1 ? '#34D3A8' : '#243350',
                      color: h.rank === 1 ? '#06231C' : '#E8EEF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    {h.rank}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{h.name}</span>
                      <span className="mono" style={{ fontWeight: 600, fontSize: '18px', color: h.rank === 1 ? '#34D3A8' : '#E8EEF8' }}>
                        {fmt(h.total)}
                      </span>
                    </span>
                    <span style={{ fontSize: '12px', color: '#A3B2CA' }}>{h.dist} km · {h.tags}</span>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span className={`chip ${h.capCls}`}>{h.cap}</span>
                      <span className={`chip ${h.rank === 1 ? 'c-green' : h.id === 'mayo' ? 'c-amber' : 'c-gray'}`}>
                        {h.rank === 1 ? 'FASTEST' : h.id === 'mayo' ? 'SHORTEST DISTANCE' : 'ALTERNATIVE'}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <span style={{ fontSize: '12px', color: '#7F90AB', lineHeight: 1.5 }}>
            Capacity and speciality data are used only if available from PSCA or 1122. Values shown are sample data.
          </span>
        </section>

        {/* Selected Route Map */}
        <section className="card" style={{ flex: '3 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Route map">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Selected route</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#A3B2CA' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '4px', borderRadius: '2px', background: '#34D3A8' }}></span>
                Traffic-aware A*
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: 0, borderTop: '3px dashed #F6B93B' }}></span>
                Shortest distance
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '4px', borderRadius: '2px', background: '#FF7A7A' }}></span>
                Congested
              </span>
            </div>
          </div>

          <svg viewBox="0 0 900 520" style={{ width: '100%', height: 'auto', borderRadius: '10px', background: '#0D1627', border: '1px solid #1B2B46' }} role="img" aria-label="Route comparison map">
            <path d="M0 270 C 250 230, 600 300, 900 250" fill="none" stroke="#12304F" strokeWidth="26" opacity="0.8" />
            <g stroke="#1B2B46" strokeWidth="12" fill="none" strokeLinecap="round">
              <path d="M20 90H880M20 200H880M20 320H880M20 440H880" />
              <path d="M70 40V490M230 40V490M400 40V490M560 40V490M720 40V490" />
            </g>
            <g fill="none" strokeLinecap="round" strokeWidth="8" opacity="0.85">
              <path d="M70 440V90" stroke="#FF7A7A" />
              <path d="M230 200V320" stroke="#FF7A7A" />
              <path d="M400 320H720" stroke="#F6B93B" />
              <path d="M560 200V90" stroke="#F6B93B" />
            </g>
            <polyline points={curRoutePoints.shortPts} fill="none" stroke="#F6B93B" strokeWidth="3" strokeDasharray="9 8" strokeLinejoin="round" opacity={sameRoute ? 0 : 0.9} />
            <polyline points={curRoutePoints.aware} fill="none" stroke="#34D3A8" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />

            <g transform="translate(70 440)">
              <circle r="12" fill="#FFFFFF" stroke="#FF7A7A" strokeWidth="2.5" />
              <path d="M0 -5v10M-5 0h10" stroke="#E5484D" strokeWidth="3" strokeLinecap="round" />
            </g>
            <text x="40" y="478" fontFamily="'IBM Plex Sans', sans-serif" fontSize="12" fontWeight="600" fill="#A3B2CA">AMB-017</text>

            <g fontFamily="'IBM Plex Sans', sans-serif" fontSize="12" fontWeight="600" textAnchor="middle">
              <g transform="translate(800 72)" opacity={selId === 'jinnah' ? 1 : 0.4}>
                <rect width="40" height="36" rx="9" fill={selId === 'jinnah' ? '#1E3A5F' : '#16233A'} />
                <text x="20" y="25" fontSize="20" fontWeight="700" fill="#E8EEF8">H</text>
                <text x="20" y="54" fill="#A3B2CA">Jinnah</text>
              </g>
              <g transform="translate(540 302)" opacity={selId === 'services' ? 1 : 0.4}>
                <rect width="40" height="36" rx="9" fill={selId === 'services' ? '#1E3A5F' : '#16233A'} />
                <text x="20" y="25" fontSize="20" fontWeight="700" fill="#E8EEF8">H</text>
                <text x="20" y="54" fill="#A3B2CA">Services</text>
              </g>
              <g transform="translate(210 54)" opacity={selId === 'mayo' ? 1 : 0.4}>
                <rect width="40" height="36" rx="9" fill={selId === 'mayo' ? '#1E3A5F' : '#16233A'} />
                <text x="20" y="25" fontSize="20" fontWeight="700" fill="#E8EEF8">H</text>
                <text x="20" y="-8" fill="#A3B2CA">Mayo</text>
              </g>
            </g>
          </svg>

          {/* Cards below Route Map */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ flex: '1 1 160px', padding: '14px 16px', borderRadius: '10px', background: '#0F1A2E', border: '1px solid #243350', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Predicted arrival</span>
              <span className="mono" style={{ fontSize: '26px', fontWeight: 600, color: '#34D3A8' }}>{fmt(cur.total)}</span>
            </div>
            <div style={{ flex: '1 1 160px', padding: '14px 16px', borderRadius: '10px', background: '#0F1A2E', border: '1px solid #243350', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Shortest-distance route</span>
              <span className="mono" style={{ fontSize: '26px', fontWeight: 600, color: '#F6B93B' }}>{fmt(cur.short)}</span>
            </div>
            <div style={{ flex: '1 1 160px', padding: '14px 16px', borderRadius: '10px', background: '#0F1A2E', border: '1px solid #243350', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Time gained</span>
              <span className="mono" style={{ fontSize: '26px', fontWeight: 600 }}>
                {gain > 0 ? `−${fmt(gain)}` : 'same route'}
              </span>
            </div>
          </div>
          <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.5 }}>{cur.insight}</span>
        </section>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
        {/* Edge Cost Breakdown */}
        <section className="card" style={{ flex: '3 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Edge cost breakdown">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Why this route? Edge cost breakdown</h2>
            <span className="mono" style={{ fontSize: '14px', fontWeight: 600 }}>{fmt(cur.total)} total</span>
          </div>

          <div style={{ display: 'flex', height: '14px', borderRadius: '999px', overflow: 'hidden', background: '#243350' }}>
            {costs.map((c, i) => (
              <div key={i} style={{ height: '100%', background: c.color, width: c.w }}></div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {costs.map((c, i) => (
              <div key={i} style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A3B2CA' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: c.color }}></span>
                  {c.label}
                </span>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 600 }}>{c.value}</span>
              </div>
            ))}
          </div>

          <span style={{ fontSize: '13px', color: '#7F90AB', lineHeight: 1.5 }}>
            Edge cost = predicted travel time + congestion, signal-delay and incident penalties. Dijkstra and A* baselines come first, then the time-dependent traffic-weighted A*.
          </span>
        </section>

        {/* Confirm Plan */}
        <section className="card" style={{ flex: '2 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }} aria-label="Confirm plan">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Confirm plan</h2>
            <span style={{ fontSize: '14px', color: '#A3B2CA', lineHeight: 1.55 }}>
              Route to <b style={{ color: '#E8EEF8' }}>{cur.name}</b> crosses 4 signalised intersections. Next, the corridor engine schedules priority at each one.
            </span>
          </div>
          <button type="button" onClick={() => onNavigate('corridor')} className="btn-p">
            Plan green corridor
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06231C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </section>
      </div>
    </main>
  );
};
