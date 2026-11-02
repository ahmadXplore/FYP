import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Sidebar';
import { apiService } from '../services/api';
import { Navigation, ArrowRight, Check, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

interface RoutingViewProps {
  onNavigate: (page: PageId) => void;
}

interface RankedHospital {
  id: string;
  name: string;
  dist: string;
  tags: string;
  cap: string;
  capCls: string;
  travel: number;
  cong: number;
  signal: number;
  short: number;
  rank: number;
  insight: string;
  total: number;
}

export const RoutingView: React.FC<RoutingViewProps> = ({ onNavigate }) => {
  const [selId, setSelId] = useState('jinnah');
  const [incidentActive, setIncidentActive] = useState(false);
  const [routeError, setRouteError] = useState('');

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const ROUTE_POINTS: Record<string, { aware: string; shortPts: string }> = {
    jinnah: { aware: '70,440 230,440 400,440 400,320 400,200 560,200 720,200 720,90 800,90', shortPts: '70,440 70,90 800,90' },
    services: { aware: '70,440 230,440 400,440 560,440 560,320', shortPts: '70,440 230,440 230,320 400,320 560,320' },
    mayo: { aware: '70,440 230,440 230,320 230,200 230,90', shortPts: '70,440 230,440 230,320 230,200 230,90' },
  };

  const DEFAULT_H: RankedHospital[] = [
    { id: 'jinnah', name: 'Jinnah Hospital', dist: '5.3', tags: 'Cardiac · Trauma', cap: 'ER beds available', capCls: 'c-green', travel: 340, cong: 45, signal: 35, short: 530, rank: 1, insight: 'Longer geometric distance but fastest travel time: the dynamic routing engine bypasses the congested western canal corridor.' },
    { id: 'services', name: 'Services Hospital', dist: '4.8', tags: 'Cardiac', cap: 'ER beds limited', capCls: 'c-amber', travel: 380, cong: 60, signal: 65, short: 545, rank: 2, insight: 'Direct arterial route intersects multiple queued approaches; rerouted to primary southern expressway.' },
    { id: 'mayo', name: 'Mayo Hospital', dist: '4.1', tags: 'Trauma · Neurology', cap: 'ER beds available', capCls: 'c-green', travel: 300, cong: 190, signal: 90, short: 580, rank: 3, insight: 'Nearest by straight-line distance, but severe bottleneck queues make it 52 seconds slower than Jinnah Hospital.' },
  ].map((h) => ({ ...h, total: h.travel + h.cong + h.signal }));

  const [H, setH] = useState(DEFAULT_H);

  useEffect(() => {
    const fetchRouting = async () => {
      try {
        const res = await apiService.getRouting();
        setIncidentActive(!!res.incident_active);
        const mapped: RankedHospital[] = res.hospitals.map((h) => ({
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
      } catch (requestError) {
        setRouteError(requestError instanceof Error ? requestError.message : 'Could not load live routing predictions.');
      }
    };
    fetchRouting();
  }, []);

  const cur = H.find((h) => h.id === selId) || H[0];
  const curRoutePoints = ROUTE_POINTS[cur.id] || ROUTE_POINTS['jinnah'];
  const gain = cur.short - cur.total;
  const sameRoute = cur.id === 'mayo';

  // Categorical palette: #1D70B8 (Primary), #F47738 (Warning), #3E6498 (Navy-600)
  const costs = [
    { label: 'Free-flow Travel Time', value: fmt(cur.travel), color: 'var(--primary)', w: (cur.travel / cur.total * 100).toFixed(1) + '%' },
    { label: 'Traffic Congestion Delay', value: fmt(cur.cong), color: 'var(--warning)', w: (cur.cong / cur.total * 100).toFixed(1) + '%' },
    { label: 'Intersection Hold Delay', value: fmt(cur.signal), color: 'var(--navy-600)', w: (cur.signal / cur.total * 100).toFixed(1) + '%' }
  ];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Hospital Ranking Matrix */}
        <section
          className="card"
          style={{ flex: '2 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Hospital Ranking by Predicted Arrival Time"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="lbl">Multi-Criteria Destination Optimization</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Hospital Ranking Matrix</h2>
            </div>
            <span className="chip c-gray">EM-0412 · P1</span>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Ranked strictly by <strong>predicted arrival time</strong> (including queue and signal hold penalties),
            never by static distance alone.
          </span>

          {routeError && (
            <div
              role="alert"
              style={{
                fontSize: '12px',
                color: 'var(--warning)',
                padding: '8px 10px',
                background: 'rgba(244, 119, 56, 0.08)',
                border: '1px solid rgba(244, 119, 56, 0.25)',
                borderRadius: '4px',
              }}
            >
              {routeError} Displaying calibrated simulation data.
            </div>
          )}

          <div role="group" aria-label="Select destination hospital" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {H.map((h) => {
              const on = selId === h.id;
              const isBest = h.rank === 1;
              return (
                <button
                  key={h.id}
                  type="button"
                  className={`pick ${on ? 'pick-on' : ''}`}
                  onClick={() => setSelId(h.id)}
                  aria-pressed={on}
                  style={{
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '4px',
                    borderLeft: on ? '3px solid var(--accent-gold)' : isBest ? '3px solid var(--success)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '2px',
                      flexShrink: 0,
                      background: isBest ? 'var(--navy-800)' : 'var(--surface-alt)',
                      color: isBest ? 'var(--accent-gold)' : 'var(--text)',
                      border: isBest ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    {h.rank}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                        {h.name}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: '16px',
                          color: isBest ? 'var(--success)' : 'var(--text)',
                        }}
                      >
                        {fmt(h.total)}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {h.dist} km · {h.tags}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span className={`chip ${h.capCls}`}>{h.cap}</span>
                      <span className={`chip ${isBest ? 'c-green' : h.id === 'mayo' ? 'c-amber' : 'c-gray'}`}>
                        {isBest ? 'FASTEST ARRIVAL' : h.id === 'mayo' ? 'SHORTEST DISTANCE (DELAYED)' : 'BACKUP OPTION'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Punjab 1122 ER bed availability is synchronized via hospital telemetry API.
          </span>
        </section>

        {/* Selected Route Map Preview */}
        <section
          className="card"
          style={{ flex: '3 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Route Comparison Map"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="lbl">Trajectory Comparison</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Traffic-Aware A* vs. Shortest Distance
              </h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '4px', background: 'var(--success)' }} />
                <span>Traffic-Aware A* (Fastest)</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: 0, borderTop: '2px dashed var(--text-secondary)' }} />
                <span>Shortest Road (Congested)</span>
              </span>
            </div>
          </div>

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
              viewBox="0 0 900 520"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="Route comparison map between selected hospital routes"
            >
              {/* Canal Waterway representation */}
              <path d="M0 270 C 250 230, 600 300, 900 250" fill="none" stroke="var(--navy-100)" strokeWidth="26" opacity="0.6" />

              {/* Road Grid */}
              <g stroke="var(--border-subtle)" strokeWidth="12" fill="none" strokeLinecap="square">
                <path d="M20 90H880M20 200H880M20 320H880M20 440H880" />
                <path d="M70 40V490M230 40V490M400 40V490M560 40V490M720 40V490" />
              </g>

              {/* Congested Segments */}
              <g fill="none" strokeLinecap="square" strokeWidth="6" opacity="0.8">
                <path d="M70 440V90" stroke="var(--danger)" />
                <path d="M230 200V320" stroke="var(--danger)" />
                <path d="M400 320H720" stroke="var(--warning)" />
                <path d="M560 200V90" stroke="var(--warning)" />
              </g>

              {/* Shortest Distance Route (Dijkstra baseline) */}
              <polyline
                points={curRoutePoints.shortPts}
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="3"
                strokeDasharray="8 6"
                strokeLinejoin="round"
                opacity={sameRoute ? 0 : 0.9}
              />

              {/* Traffic-Aware A* Priority Route (High visibility: White border + Solid Green) */}
              <polyline
                points={curRoutePoints.aware}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinejoin="round"
                strokeLinecap="square"
              />
              <polyline
                points={curRoutePoints.aware}
                fill="none"
                stroke="var(--success)"
                strokeWidth="6"
                strokeLinejoin="round"
                strokeLinecap="square"
              />

              {/* Ambulance Origin Location */}
              <g transform="translate(70 440)">
                <rect x="-14" y="-14" width="28" height="28" rx="2" fill="var(--danger)" stroke="#FFFFFF" strokeWidth="2" />
                <path d="M0 -7v14M-7 0h14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="square" />
                <text x="0" y="28" textAnchor="middle" fontFamily="'Public Sans', sans-serif" fontSize="11" fontWeight="700" fill="var(--text)">
                  AMB-017
                </text>
              </g>

              {/* Hospitals along the sector */}
              <g fontFamily="'Public Sans', sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
                {/* Jinnah Hospital */}
                <g transform="translate(800 70)" opacity={selId === 'jinnah' ? 1 : 0.45}>
                  <rect width="44" height="40" rx="3" fill="var(--navy-800)" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M22 10v20M12 20h20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square" />
                  <text x="22" y="54" fill="var(--text)">Jinnah Hospital</text>
                </g>

                {/* Services Hospital */}
                <g transform="translate(540 300)" opacity={selId === 'services' ? 1 : 0.45}>
                  <rect width="44" height="40" rx="3" fill="var(--navy-800)" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M22 10v20M12 20h20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square" />
                  <text x="22" y="54" fill="var(--text)">Services Hospital</text>
                </g>

                {/* Mayo Hospital */}
                <g transform="translate(210 50)" opacity={selId === 'mayo' ? 1 : 0.45}>
                  <rect width="44" height="40" rx="3" fill="var(--navy-800)" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M22 10v20M12 20h20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square" />
                  <text x="22" y="-8" fill="var(--text)">Mayo Hospital</text>
                </g>
              </g>
            </svg>
          </div>

          {/* Time Gain Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="lbl" style={{ fontSize: '10px' }}>Predicted Arrival (A*)</span>
              <span className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>
                {fmt(cur.total)}
              </span>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="lbl" style={{ fontSize: '10px' }}>Shortest Road Time</span>
              <span className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--warning)' }}>
                {fmt(cur.short)}
              </span>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="lbl" style={{ fontSize: '10px' }}>Dynamic Net Savings</span>
              <span className="mono" style={{ fontSize: '22px', fontWeight: 700, color: gain > 0 ? 'var(--success)' : 'var(--text)' }}>
                {gain > 0 ? `−${fmt(gain)}` : 'Identical Road'}
              </span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {cur.insight}
          </span>
        </section>
      </div>

      {/* Bottom Section: Edge Cost Breakdown & Corridor Confirmation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
        {/* Edge Cost Breakdown */}
        <section
          className="card"
          style={{ flex: '3 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Edge Cost Breakdown"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="lbl">Cost Function Rationale</span>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Why this route? Objective Function Cost Breakdown
              </h2>
            </div>
            <span className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
              {fmt(cur.total)} Total Route Cost
            </span>
          </div>

          {/* Segmented bar without gradients */}
          <div style={{ display: 'flex', height: '12px', borderRadius: '2px', overflow: 'hidden', background: 'var(--border-subtle)' }}>
            {costs.map((c, i) => (
              <div key={i} style={{ height: '100%', background: c.color, width: c.w }} />
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            {costs.map((c, i) => (
              <div key={i} style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: c.color }} />
                  {c.label}
                </span>
                <span className="mono" style={{ fontSize: '16px', fontWeight: 700 }}>{c.value}</span>
              </div>
            ))}
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Cost formula: <code>Cost(e) = T_travel(e) + W_cong · Delay_cong(e) + W_sig · Delay_sig(e)</code>.
            Evaluated by the traffic-weighted A* solver with live TraCI speed feedback.
          </span>
        </section>

        {/* Action Panel to Corridor Planner */}
        <section
          className="card"
          style={{
            flex: '2 1 300px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            background: 'var(--navy-50)',
            borderLeft: '4px solid var(--accent-gold)',
          }}
          aria-label="Confirm Green Corridor"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="lbl" style={{ color: 'var(--navy-800)' }}>Phase Preemption Next Step</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)' }}>
              Authorize Corridor Sequence
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--navy-700)', lineHeight: 1.5 }}>
              Selected destination is <strong>{cur.name}</strong> ({cur.dist} km). The trajectory spans
              4 signalized intersections. Click below to inspect green wave timings in the planner.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('corridor')}
            className="btn-p"
            style={{ width: '100%', gap: '8px' }}
          >
            <span>Plan Green Wave Corridor</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </section>
      </div>
    </main>
  );
};
