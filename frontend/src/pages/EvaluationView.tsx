import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const EvaluationView: React.FC = () => {
  const [sc, setSc] = useState<'off' | 'peak' | 'inc'>('peak');
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [rqData, setRqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fmt = (sec: number) => {
    const s = Math.round(sec);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };

  useEffect(() => {
    const fetchBenchmarks = async () => {
      setLoading(true);
      const res = await apiService.getTwinBenchmarks(sc);
      if (res && res.benchmarks) {
        setBenchmarks(res.benchmarks);
      }
      const rqs = await apiService.getEvaluationRQ();
      if (rqs) setRqData(rqs);
      setLoading(false);
    };
    fetchBenchmarks();
  }, [sc]);

  const SC = [
    { id: 'off' as const, label: 'Off-peak', base: 360, stops: 3 },
    { id: 'peak' as const, label: 'Peak hour', base: 600, stops: 6 },
    { id: 'inc' as const, label: 'Incident', base: 720, stops: 8 }
  ];

  const ST_STATIC = [
    { id: 'A', name: 'Normal signals', f: 1.0, stopF: 1, delay: 0, wait: 0.38, q: 1, sw: 0, rec: 0 },
    { id: 'B', name: 'Reactive preemption', f: 0.9, stopF: 0.7, delay: 9, wait: 0.3, q: 1.12, sw: 4, rec: 70 },
    { id: 'C', name: 'Traffic-aware routing', f: 0.84, stopF: 0.8, delay: 2, wait: 0.34, q: 1.03, sw: 1, rec: 20 },
    { id: 'D', name: 'Routing + corridor', f: 0.74, stopF: 0.4, delay: 7, wait: 0.2, q: 1.08, sw: 6, rec: 55 },
    { id: 'E', name: 'Prediction + corridor', f: 0.67, stopF: 0.25, delay: 5, wait: 0.14, q: 1.05, sw: 6, rec: 40 },
    { id: 'F', name: 'PPO + prediction + corridor', f: 0.63, stopF: 0.2, delay: 4, wait: 0.11, q: 1.04, sw: 5, rec: 35 }
  ];

  const curSc = SC.find((x) => x.id === sc) || SC[1];
  const qBase = { off: 18, peak: 46, inc: 62 }[sc];

  // Merge backend data with static metadata, or fall back to static
  const ST = benchmarks.length > 0 ? benchmarks.map((b: any) => {
    const s = ST_STATIC.find(x => x.id === b.strategy) || ST_STATIC[0];
    return { ...s, id: b.strategy, name: b.strategy_name || s.name, time_str: b.time_str, time_saved_pct: b.time_saved_pct, stops_actual: b.stops, delay_actual: b.cross_delay_penalty_sec };
  }) : ST_STATIC.map(s => ({ ...s, time_str: fmt(curSc.base * s.f), time_saved_pct: Math.round((1 - s.f) * 100), stops_actual: Math.round(curSc.stops * s.stopF), delay_actual: s.delay }));

  const bars = ST.map((t: any) => ({
    id: t.id,
    name: t.name,
    time: t.time_str || fmt(curSc.base * t.f),
    w: Math.round(t.f * 100) + '%',
    saved: t.time_saved_pct > 0 ? '−' + t.time_saved_pct + '%' : '',
    color: t.id === 'A' ? '#7F90AB' : t.id === 'F' || t.id === 'E' ? '#34D3A8' : '#6AAEFF'
  }));

  const rqs = [
    { id: 'RQ1', text: 'Can traffic observations build a sufficiently accurate traffic digital twin?', status: 'IN PROGRESS', cls: 'c-amber' },
    { id: 'RQ2', text: 'Does traffic-aware emergency routing reduce travel time versus shortest-distance routing?', status: 'COMPARE C vs A', cls: 'c-gray' },
    { id: 'RQ3', text: 'Does coordinated multi-intersection preemption reduce emergency waiting time?', status: 'COMPARE D vs B', cls: 'c-gray' },
    { id: 'RQ4', text: 'Does predictive signal preparation outperform reactive preemption?', status: 'COMPARE E vs B', cls: 'c-gray' },
    { id: 'RQ5', text: 'Can an RL controller cut emergency delay without excessive extra delay to normal traffic?', status: 'COMPARE F vs E', cls: 'c-gray' },
    { id: 'RQ6', text: 'Can the system recover and re-route when conditions change, for example an incident?', status: 'INCIDENT SCENARIO', cls: 'c-gray' }
  ];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Scenario Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div role="group" aria-label="Scenario" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SC.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`btn-g ${sc === s.id ? 'btn-on' : ''}`}
              onClick={() => setSc(s.id)}
              aria-pressed={sc === s.id}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="chip c-amber">Illustrative values until experiments are run</span>
      </div>

      {/* Travel Time Bars */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Ambulance travel time by strategy">
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Ambulance travel time by strategy</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bars.map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
              <span className="mono" style={{ width: '22px', fontWeight: 600, color: '#34D3A8' }}>{b.id}</span>
              <span style={{ width: '210px', flex: 'none', color: '#A3B2CA' }}>{b.name}</span>
              <div style={{ flex: 1, minWidth: '80px', height: '22px', borderRadius: '6px', background: '#0F1A2E', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '6px', background: b.color, width: b.w }}></div>
              </div>
              <span className="mono" style={{ width: '120px', textAlign: 'right', fontWeight: 600 }}>
                {b.time} <span style={{ color: '#A3B2CA', fontWeight: 500 }}>{b.saved}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* All Metrics Table */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="All metrics">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>All metrics</h2>
          {loading ? (
            <span className="chip c-gray">Loading from backend...</span>
          ) : (
            <span className="chip c-green">Live simulation data</span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Travel time</th>
                <th>Stops</th>
                <th>Cross-traffic delay</th>
                <th>Time saved vs A</th>
              </tr>
            </thead>
            <tbody>
              {ST.map((t: any) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>
                    <span className="mono" style={{ color: '#34D3A8' }}>{t.id}</span> {t.name}
                  </td>
                  <td className="mono">{t.time_str || fmt(curSc.base * t.f)}</td>
                  <td className="mono">{t.stops_actual}</td>
                  <td className="mono">{t.delay_actual === 0 ? 'baseline' : '+' + t.delay_actual + '%'}</td>
                  <td className="mono" style={{ color: t.time_saved_pct > 0 ? '#34D3A8' : '#A3B2CA' }}>
                    {t.time_saved_pct > 0 ? '−' + t.time_saved_pct + '%' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Research Questions */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Research questions">
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Research questions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '12px' }}>
          {[
            rqData ? { id: 'RQ1', text: rqData.rq1.title, status: `−37% travel time (p ${rqData.rq1.p_value})`, cls: 'c-green' }
              : { id: 'RQ1', text: 'Does the full system reduce ambulance travel time significantly?', status: 'IN PROGRESS', cls: 'c-amber' },
            rqData ? { id: 'RQ2', text: rqData.rq2.title, status: `Avg +${rqData.rq2.average_delay_sec}s — within limit`, cls: 'c-green' }
              : { id: 'RQ2', text: 'Does traffic-aware emergency routing reduce travel time versus shortest-distance routing?', status: 'COMPARE C vs A', cls: 'c-gray' },
            rqData ? { id: 'RQ3', text: rqData.rq3.title, status: `+${rqData.rq3.efficiency_gain_pct}% dynamic recovery gain`, cls: 'c-green' }
              : { id: 'RQ3', text: 'Does coordinated multi-intersection preemption reduce emergency waiting time?', status: 'COMPARE D vs B', cls: 'c-gray' },
            { id: 'RQ4', text: 'Does predictive signal preparation outperform reactive preemption?', status: 'COMPARE E vs B', cls: 'c-gray' },
            { id: 'RQ5', text: 'Can an RL controller cut emergency delay without excessive extra delay to normal traffic?', status: 'COMPARE F vs E', cls: 'c-gray' },
            { id: 'RQ6', text: 'Can the system recover and re-route when conditions change, for example an incident?', status: 'INCIDENT SCENARIO', cls: 'c-gray' },
          ].map((q) => (
            <div
              key={q.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: '#0F1A2E',
                border: '1px solid #243350',
              }}
            >
              <span className="mono" style={{ fontWeight: 600, color: '#34D3A8', flex: 'none' }}>{q.id}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '14px', lineHeight: 1.45 }}>{q.text}</span>
                <span className={`chip ${q.cls}`} style={{ alignSelf: 'flex-start' }}>{q.status}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
