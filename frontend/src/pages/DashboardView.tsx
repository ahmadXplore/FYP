import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Sidebar';
import { apiService, EmergencyRecord, HospitalRoute } from '../services/api';
import { EmergencyIntakeView, EmergencySource } from './EmergencyIntakeView';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingDown,
  Activity,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

interface DashboardViewProps {
  initialEmergency?: EmergencyRecord | null;
  onNavigate: (page: PageId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ initialEmergency = null, onNavigate }) => {
  const [emergencies, setEmergencies] = useState<EmergencyRecord[]>(initialEmergency ? [initialEmergency] : []);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(initialEmergency?.id ?? null);
  const [isLoadingEmergencies, setIsLoadingEmergencies] = useState(true);
  const [emergencyError, setEmergencyError] = useState('');
  const [showIntake, setShowIntake] = useState(false);
  const [intakeSource, setIntakeSource] = useState<EmergencySource>('1122');
  const [corridorPlan, setCorridorPlan] = useState<HospitalRoute | null>(null);
  const [corridorGeneratedFor, setCorridorGeneratedFor] = useState<string | null>(null);
  const [corridorError, setCorridorError] = useState('');
  const [t, setT] = useState(0.24);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [incident, setIncident] = useState(false);
  const [incidentAt, setIncidentAt] = useState(0);
  const [cong, setCong] = useState(true);
  const [alt, setAlt] = useState(true);
  const [hold, setHold] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchEmergencies = async () => {
      try {
        const response = await apiService.getEmergencies();
        if (active && response) {
          const records = initialEmergency
            ? [initialEmergency, ...response.emergencies.filter((emergency) => emergency.id !== initialEmergency.id)]
            : response.emergencies;
          setEmergencies(records);
          const current = initialEmergency || records.find((emergency) => emergency.status === 'ACTIVE' || emergency.status === 'DISPATCHED')
            || records[0];
          setSelectedEmergencyId(current?.id ?? null);
        }
      } catch (requestError) {
        if (active) {
          setEmergencyError(requestError instanceof Error ? requestError.message : 'Could not load emergencies.');
        }
      } finally {
        if (active) setIsLoadingEmergencies(false);
      }
    };
    fetchEmergencies();
    return () => { active = false; };
  }, [initialEmergency]);

  const selectedEmergency = emergencies.find((emergency) => emergency.id === selectedEmergencyId) || null;
  const activeEmergencyCount = emergencies.filter((emergency) => emergency.status === 'ACTIVE' || emergency.status === 'DISPATCHED').length;
  const emergencySource = (notes?: string) => notes?.startsWith('Source: 1122')
    ? '1122'
    : notes?.startsWith('Source: System anomaly')
      ? 'System anomaly'
      : 'Operator entry';

  const handleEmergencyCreated = (emergency: EmergencyRecord) => {
    setEmergencies((current) => [emergency, ...current.filter((item) => item.id !== emergency.id)]);
    setSelectedEmergencyId(emergency.id);
    setShowIntake(false);
    setCorridorPlan(null);
    setCorridorGeneratedFor(null);
    setCorridorError('');
  };

  const handleGenerateCorridor = async () => {
    if (!selectedEmergency) return;
    setCorridorError('');
    try {
      const response = await apiService.getRouting();
      if (!response?.hospitals.length) throw new Error('No route or hospital recommendation is available.');
      const recommendedHospital = response.hospitals.find((hospital) => hospital.rank === 1) || response.hospitals[0];
      setCorridorPlan(recommendedHospital);
      setCorridorGeneratedFor(selectedEmergency.id);
    } catch (requestError) {
      setCorridorError(requestError instanceof Error ? requestError.message : 'Could not generate the corridor plan.');
    }
  };

  // Animation tick loop
  useEffect(() => {
    const iv = setInterval(() => {
      if (!playing) return;
      setT((prev) => {
        const next = prev + speed / 600;
        if (next >= 1) {
          if (hold < 25) {
            setHold((h) => h + 1);
            return 1;
          }
          setHold(0);
          setIncident(false);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(iv);
  }, [playing, speed, hold]);

  // Geometry
  const WP = [
    [70, 440], [230, 440], [400, 440], [400, 320], [400, 200],
    [560, 200], [720, 200], [720, 90], [800, 90]
  ];
  const cum = [0];
  for (let i = 1; i < WP.length; i++) {
    cum.push(cum[i - 1] + Math.abs(WP[i][0] - WP[i - 1][0]) + Math.abs(WP[i][1] - WP[i - 1][1]));
  }
  const L = cum[cum.length - 1];
  const TOTAL = 420;
  const cur = t * L;

  const eta = (d: number) => Math.max(0, (d - cur) / L * TOTAL);
  const fmt = (sec: number) => {
    const s = Math.round(sec);
    const m = Math.floor(s / 60), r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  };

  // Ambulance position and trail
  let seg = 0;
  while (seg < WP.length - 2 && cur > cum[seg + 1]) seg++;
  const f = Math.min(1, Math.max(0, (cur - cum[seg]) / (cum[seg + 1] - cum[seg])));
  const ax = WP[seg][0] + (WP[seg + 1][0] - WP[seg][0]) * f;
  const ay = WP[seg][1] + (WP[seg + 1][1] - WP[seg][1]) * f;
  const pts = WP.slice(0, seg + 1).map((p) => p.join(','));
  pts.push(ax.toFixed(1) + ',' + ay.toFixed(1));
  const dx = WP[seg + 1][0] - WP[seg][0], dy = WP[seg + 1][1] - WP[seg][1];
  const heading = dx > 0 ? 'East' : dx < 0 ? 'West' : dy < 0 ? 'North' : 'South';

  const STY: Record<string, { color: string; cls: string; label: string; action: string }> = {
    green: { color: 'var(--success)', cls: 'c-green', label: 'PRIORITY GREEN', action: 'Priority green held until ambulance clears junction stopline.' },
    prep: { color: 'var(--warning)', cls: 'c-amber', label: 'PREPARING', action: 'Shortening cross-street phase; queue pre-clearing.' },
    monitor: { color: 'var(--text-secondary)', cls: 'c-gray', label: 'MONITOR', action: 'Normal cycle. Slot reserved for predicted ETA.' },
    cleared: { color: 'var(--primary)', cls: 'c-blue', label: 'RESTORED', action: 'Ambulance cleared. Resumed local coordination plan.' }
  };

  const defs = [{ id: 'I1', wp: 1 }, { id: 'I2', wp: 3 }, { id: 'I3', wp: 5 }, { id: 'I4', wp: 7 }];
  const stage = (d: number) => {
    if (cur > d + 25) return 'cleared';
    const e = eta(d);
    if (e <= 20) return 'green';
    if (e <= 60) return 'prep';
    return 'monitor';
  };

  const js = defs.map((j) => {
    const d = cum[j.wp];
    const st = stage(d);
    const o = STY[st];
    return {
      id: j.id,
      color: o.color,
      cls: o.cls,
      label: o.label,
      action: o.action,
      eta: st === 'cleared' ? 'Passed' : fmt(eta(d)),
      state: st,
      d
    };
  });

  // Decision feed
  const evs: Array<{ t: number; tag: string; dot: string; text: string }> = [
    { t: 0, tag: 'DISPATCH', dot: 'var(--primary)', text: 'Emergency priority call registered: cardiac arrest, Priority P1. Unit AMB-017 dispatched.' },
    { t: 0.01, tag: 'ROUTING', dot: 'var(--warning)', text: 'Destination Jinnah Hospital selected by dynamic travel-time model. 4-junction corridor calculated.' },
    { t: 0.02, tag: 'SAFETY', dot: 'var(--success)', text: 'Safety Validator approved I1 green priority. Conflict and minimum-green constraints satisfied.' }
  ];

  defs.forEach((j) => {
    const d = cum[j.wp];
    const tPrep = Math.max(0.03, (d - 60 / TOTAL * L) / L);
    const tGreen = Math.max(0.03, (d - 20 / TOTAL * L) / L);
    const tClear = (d + 25) / L;
    if (j.id !== 'I1') {
      evs.push({ t: tPrep, tag: 'CORRIDOR', dot: 'var(--warning)', text: `${j.id} preemption scheduled: cross-street phase shortened, queue pre-clearing.` });
      evs.push({ t: tGreen, tag: 'SAFETY', dot: 'var(--success)', text: `${j.id} priority green actuated. NFR1 safety invariants checked.` });
    }
    evs.push({ t: tClear, tag: 'RESTORE', dot: 'var(--text-secondary)', text: `${j.id} returned to standard signal cycle plan.` });
  });

  evs.push({ t: 0.999, tag: 'ARRIVAL', dot: 'var(--primary)', text: 'AMB-017 arrived at Jinnah Hospital emergency entrance. Corridor completed.' });
  if (incident) {
    evs.push({ t: incidentAt, tag: 'INCIDENT', dot: 'var(--danger)', text: 'Downstream obstruction detected near I3. Corridor recalculation initiated; I3 hold extended.' });
  }

  const feed = evs
    .filter((e) => e.t <= t + 0.0005)
    .sort((a, b) => b.t - a.t)
    .slice(0, 6)
    .map((e) => ({ text: e.text, tag: e.tag, dot: e.dot, time: 'T+' + fmt(e.t * TOTAL) }));

  const rem = eta(L);
  const base = rem * 1.3;
  const cleared = js.filter((j) => j.state === 'cleared').length;
  const corridorReady = selectedEmergency && corridorGeneratedFor === selectedEmergency.id;

  const checks = [
    { text: 'Phase sequence valid (no skip cycles)', ok: true },
    { text: 'Minimum green & clearance respected', ok: true },
    { text: 'Conflicting movements red locked', ok: true },
    { text: 'Pedestrian clearance interval protected', ok: true },
    { text: incident ? 'I3 cross-arterial queue threshold warning' : 'Cross-traffic delay within acceptable bounds', ok: !incident }
  ].map((c) => ({
    text: c.text,
    color: c.ok ? 'var(--success)' : 'var(--danger)',
    result: c.ok ? 'PASS' : 'DEVIATION',
  }));

  const segments = [
    { name: 'Start → I1', speed: 38, w: '76%', color: 'var(--success)' },
    { name: 'I1 → I2', speed: 24, w: '48%', color: 'var(--warning)' },
    { name: 'I2 → I3', speed: incident ? 12 : 31, w: incident ? '24%' : '62%', color: incident ? 'var(--danger)' : 'var(--success)' },
    { name: 'I3 → Hospital', speed: 29, w: '58%', color: 'var(--success)' }
  ];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {showIntake && (
        <EmergencyIntakeView
          initialSource={intakeSource}
          onCreated={handleEmergencyCreated}
          onCancel={() => setShowIntake(false)}
        />
      )}

      {/* Official Government Overview Hero */}
      <section
        className="card"
        style={{
          background: 'var(--navy-800)',
          color: '#FFFFFF',
          padding: '24px 28px',
          borderLeft: '4px solid var(--accent-gold)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        aria-label="System Operational Overview"
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
              Punjab Safe Cities Authority · PPIC3 Dynamic Green Wave Corridor
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#FFFFFF' }}>
              Real-Time Emergency Corridor Command & Preemption
            </h2>
          </div>
          <button
            type="button"
            className="btn-p"
            onClick={() => {
              setIntakeSource('1122');
              setShowIntake(true);
            }}
            style={{
              background: 'var(--accent-gold)',
              color: '#0B0C0C',
              borderColor: 'var(--accent-gold)',
              fontWeight: 700,
            }}
          >
            <span>Register 1122 Incident</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, maxWidth: '960px' }}>
          Coordinated signal preemption across signalized intersections. Every signal actuation is validated by the
          rule-based safety engine prior to execution, ensuring protected pedestrian phases and prevention of gridlock.
        </p>
      </section>

      {/* 3 Benchmark KPI Cards (Rule requirement: 63.0% travel-time reduction, 18.4 to 6.8 min, 0 stops) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }} aria-label="System Performance KPIs">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lbl">Travel-Time Reduction</span>
            <TrendingDown size={16} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)' }}>
              63.0%
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
              ↓ vs Standard Signals
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Empirical benchmark on calibrated Lahore arterial corridor
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lbl">Mean Travel Duration</span>
            <Clock size={16} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text)' }}>
              18.4 → 6.8
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>min</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            11.6 minutes saved during peak-hour traffic conditions
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lbl">Emergency Stops at Signals</span>
            <ShieldCheck size={16} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)' }}>
              0
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              stops (down from 6.0)
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Predictive phase pre-clearing eliminates red-light queue halts
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lbl">Active Corridor ETA</span>
            <Activity size={16} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary)' }}>
              {fmt(rem)}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              (Baseline {fmt(base)})
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Target: Jinnah Hospital · Corridor Segments: 4
          </span>
        </div>
      </section>

      {/* Active Emergency Dispatch Summary */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }} aria-label="Selected Emergency Details">
        <div className="card" style={{ flex: '2 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {selectedEmergency ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="lbl">Emergency Incident Record · {emergencySource(selectedEmergency.notes)}</span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                    {selectedEmergency.type} · {selectedEmergency.id}
                  </h3>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Reported at {selectedEmergency.time} · Unit {selectedEmergency.amb}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`chip ${selectedEmergency.pc}`}>{selectedEmergency.priority}</span>
                  <span className={`chip ${selectedEmergency.sc}`}>{selectedEmergency.status}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {[
                  { label: 'Scene Location', value: selectedEmergency.location },
                  { label: 'Assigned Ambulance', value: selectedEmergency.amb },
                  { label: 'Destination Hospital', value: selectedEmergency.dest },
                ].map((detail) => (
                  <div key={detail.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px 12px', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
                    <span className="lbl" style={{ fontSize: '10px' }}>{detail.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{detail.value || 'Unassigned'}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <button type="button" className="btn-p" onClick={handleGenerateCorridor}>
                  {corridorReady ? 'Re-Compute Corridor Plan' : 'Generate Dynamic Corridor Plan'}
                </button>
                {corridorReady && (
                  <button type="button" className="btn-g" onClick={() => onNavigate('corridor')}>
                    Open Corridor Planner →
                  </button>
                )}
                {corridorError && (
                  <span role="alert" style={{ fontSize: '13px', color: 'var(--danger)' }}>
                    {corridorError}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px', justifyContent: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                {isLoadingEmergencies ? 'Retrieving active dispatches…' : 'No active incident selected'}
              </h3>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Register a call or select an active emergency from the feed to view priority route.
              </span>
            </div>
          )}
        </div>

        {/* Emergency Feed List */}
        <div className="card" style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Dispatch Queue</h3>
            <span className="chip c-gray">{activeEmergencyCount} Active</span>
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {emergencies.map((em) => {
              const isSel = selectedEmergencyId === em.id;
              return (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => setSelectedEmergencyId(em.id)}
                  aria-pressed={isSel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: isSel ? '1px solid var(--navy-800)' : '1px solid var(--border-subtle)',
                    borderLeft: isSel ? '3px solid var(--accent-gold)' : '3px solid transparent',
                    background: isSel ? 'var(--navy-50)' : 'var(--surface)',
                    color: 'var(--text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span className="mono" style={{ fontSize: '12px', fontWeight: 600 }}>{em.id}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{em.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span className={`chip ${em.pc}`} style={{ height: '18px', fontSize: '10px' }}>{em.priority}</span>
                    <span className={`chip ${em.sc}`} style={{ height: '18px', fontSize: '10px' }}>{em.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Corridor Map (Flat, desaturated, high contrast, zero glow) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        <section
          className="card"
          style={{ flex: '3 1 620px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Live Corridor Map"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Corridor Signal Status & Vehicle Location
              </h2>
              <span className="chip c-gray">Ferozepur Rd Arterial</span>
            </div>

            {/* Play/Pause/Speed controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                className="btn-g"
                onClick={() => setPlaying(!playing)}
                aria-label={playing ? 'Pause Simulation' : 'Play Simulation'}
                style={{ padding: '0 10px', minHeight: '32px', fontSize: '12px' }}
              >
                {playing ? <Pause size={13} strokeWidth={1.5} /> : <Play size={13} strokeWidth={1.5} />}
                <span>{playing ? 'Pause' : 'Resume'}</span>
              </button>

              {[1, 2, 4].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`btn-g ${speed === v ? 'btn-on' : ''}`}
                  onClick={() => setSpeed(v)}
                  style={{ minWidth: '32px', minHeight: '32px', padding: '0 6px', fontSize: '12px' }}
                >
                  {v}×
                </button>
              ))}

              <button
                type="button"
                className="btn-g"
                onClick={() => {
                  setT(0);
                  setHold(0);
                  setIncident(false);
                  setPlaying(true);
                }}
                style={{ padding: '0 8px', minHeight: '32px', fontSize: '12px' }}
                title="Restart playback"
              >
                <RotateCcw size={13} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* SVG Map Container: Light desaturated basemap (#E7EAEE) or Dark (#0A141B) */}
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
              aria-label="Schematic Corridor Map showing vehicle trajectory and intersections"
            >
              {/* Canal water line representation (subtle grey-blue) */}
              <path d="M0 270 C 250 230, 600 300, 900 250" fill="none" stroke="var(--navy-100)" strokeWidth="26" opacity="0.6" />

              {/* Road Grid Network (Neutral desaturated separators) */}
              <g stroke="var(--border-subtle)" strokeWidth="12" fill="none" strokeLinecap="square">
                <path d="M20 90H880M20 200H880M20 320H880M20 440H880" />
                <path d="M70 40V490M230 40V490M400 40V490M560 40V490M720 40V490M840 40V300" />
              </g>

              {/* Lane markings */}
              <g stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 8" fill="none" opacity="0.8">
                <path d="M20 90H880M20 200H880M20 320H880M20 440H880M70 40V490M230 40V490M400 40V490M560 40V490M720 40V490" />
              </g>

              {/* Congestion overlay if active */}
              {cong && (
                <g fill="none" strokeLinecap="square" strokeWidth="6" opacity="0.8">
                  <path d="M70 440V90" stroke="var(--danger)" />
                  <path d="M230 200V320" stroke="var(--danger)" />
                  <path d="M400 320H720" stroke="var(--warning)" />
                  <path d="M560 200V90" stroke="var(--warning)" />
                </g>
              )}

              {/* Alternative shortest route (dashed grey) */}
              {alt && (
                <g>
                  <polyline
                    points="70,440 70,90 800,90"
                    fill="none"
                    stroke="var(--text-secondary)"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                    strokeLinejoin="round"
                  />
                  <text x="86" y="270" fontFamily="'Public Sans', sans-serif" fontSize="12" fontWeight="600" fill="var(--text-secondary)">
                    Shortest Distance Route (Congested)
                  </text>
                </g>
              )}

              {/* Proposed Corridor Route: Double stroke (White outline + Red / Green path) */}
              <polyline
                points="70,440 230,440 400,440 400,320 400,200 560,200 720,200 720,90 800,90"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinejoin="round"
                strokeLinecap="square"
              />
              <polyline
                points="70,440 230,440 400,440 400,320 400,200 560,200 720,200 720,90 800,90"
                fill="none"
                stroke="var(--navy-600)"
                strokeWidth="6"
                strokeLinejoin="round"
                strokeLinecap="square"
                opacity="0.3"
              />

              {/* Cleared / Traversed Green Section */}
              <polyline
                points={pts.join(' ')}
                fill="none"
                stroke="var(--success)"
                strokeWidth="6"
                strokeLinejoin="round"
                strokeLinecap="square"
              />

              {/* Incident Marker if active */}
              {incident && (
                <g transform="translate(640 200)">
                  <circle r="14" fill="var(--danger)" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M0 -7l7 14h-14z" fill="#FFFFFF" />
                  <text x="0" y="26" textAnchor="middle" fontFamily="'Public Sans', sans-serif" fontSize="11" fontWeight="700" fill="var(--danger)">
                    INCIDENT AHEAD
                  </text>
                </g>
              )}

              {/* Destination Hospital Marker */}
              <g transform="translate(800 70)">
                <rect width="44" height="40" rx="3" fill="var(--navy-800)" stroke="#FFFFFF" strokeWidth="2" />
                <path d="M22 10v20M12 20h20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square" />
                <text x="22" y="56" textAnchor="middle" fontFamily="'Public Sans', sans-serif" fontSize="11" fontWeight="700" fill="var(--navy-900)">
                  JINNAH HOSPITAL
                </text>
              </g>

              {/* Intersections I1 to I4: Square nodes with white halo & state color */}
              {defs.map((j, idx) => {
                const info = js[idx];
                const coords = [
                  [230, 440],
                  [400, 320],
                  [560, 200],
                  [720, 90]
                ][idx];

                return (
                  <g key={j.id} transform={`translate(${coords[0]} ${coords[1]})`} textAnchor="middle">
                    {/* Outer white halo */}
                    <rect x="-18" y="-18" width="36" height="36" rx="2" fill="#FFFFFF" stroke="var(--border)" strokeWidth="1" />
                    {/* Inner status box */}
                    <rect x="-14" y="-14" width="28" height="28" rx="2" fill={info.color} />
                    <text x="0" y="5" fill="#FFFFFF" fontFamily="'IBM Plex Mono', monospace" fontSize="12" fontWeight="700">
                      {j.id}
                    </text>
                    {/* Status label under node with white halo for legibility */}
                    <rect x="-35" y="24" width="70" height="18" rx="2" fill="var(--surface)" stroke="var(--border-subtle)" strokeWidth="1" />
                    <text x="0" y="37" fill="var(--text)" fontFamily="'IBM Plex Mono', monospace" fontSize="11" fontWeight="600">
                      {info.eta}
                    </text>
                  </g>
                );
              })}

              {/* Emergency Ambulance Marker (Solid Red with white outline) */}
              <g transform={`translate(${ax.toFixed(1)} ${ay.toFixed(1)})`}>
                <rect x="-15" y="-15" width="30" height="30" rx="3" fill="var(--danger)" stroke="#FFFFFF" strokeWidth="2.5" />
                <path d="M0 -7v14M-7 0h14" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="square" />
              </g>
            </svg>

            {/* Permanent Map Legend (Rule requirement) */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '8px 12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '11px',
                color: 'var(--text)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '2px' }} />
                <span>Ambulance Unit</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '4px', background: 'var(--success)' }} />
                <span>Active Green Wave</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '4px', background: 'var(--warning)' }} />
                <span>Queue Pre-Clearing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '0', borderTop: '2px dashed var(--text-secondary)' }} />
                <span>Dijkstra Baseline</span>
              </div>
            </div>
          </div>

          {/* Map Layer Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className={`btn-g ${cong ? 'btn-on' : ''}`}
                onClick={() => setCong(!cong)}
              >
                Traffic Density Layer
              </button>
              <button
                type="button"
                className={`btn-g ${alt ? 'btn-on' : ''}`}
                onClick={() => setAlt(!alt)}
              >
                Alternative Dijkstra Path
              </button>
              <button
                type="button"
                className={`btn-g ${incident ? 'btn-danger' : ''}`}
                onClick={() => {
                  if (incident) setIncident(false);
                  else {
                    setIncident(true);
                    setIncidentAt(t);
                  }
                }}
              >
                {incident ? 'Clear Simulated Obstruction' : 'Simulate Lane Obstruction'}
              </button>
            </div>

            {/* Scrubber progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary)', width: `${Math.round(t * 100)}%` }} />
              </div>
              <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {Math.round(t * 100)}%
              </span>
            </div>
          </div>
        </section>

        {/* Right Column: Corridor Status & Live Audit Feed */}
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Signal Corridor Intersections State */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Signal Preemption Status">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Signal Priority Status</h3>
              <button
                type="button"
                onClick={() => onNavigate('corridor')}
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Planner View →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {js.map((j) => (
                <div
                  key={j.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className="mono"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          background: j.color,
                        }}
                      >
                        {j.id}
                      </span>
                      <span className={`chip ${j.cls}`}>{j.label}</span>
                    </div>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 600 }}>{j.eta}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    {j.action}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* AI Decision & Audit Feed */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-label="Decision Audit Log">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Decision Audit Feed</h3>
              <span className="chip c-blue">Safety-Validated</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '220px' }}>
              {feed.map((e, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      marginTop: '5px',
                      flexShrink: 0,
                      background: e.dot,
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ color: 'var(--text)', lineHeight: 1.35 }}>{e.text}</span>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {e.time} · {e.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Safety Layer Verification Panel & Route Telemetry */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Safety Layer Verification Panel (Prompt requirement: "How the safety layer works") */}
        <section
          className="card"
          style={{ flex: '2 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}
          aria-label="Safety Layer Rules"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="lbl">Non-Functional Safety Constraints</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Rule-Based Safety Validator</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('safety')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Audit Log →
            </button>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            AI reinforcement learning models only recommend timing actions. A deterministic validator enforces
            absolute constraints prior to actuation on signal controllers.
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checks.map((c, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '2px',
                  background: 'var(--surface-alt)',
                  fontSize: '12px',
                }}
              >
                <CheckCircle2 size={15} strokeWidth={1.5} style={{ color: c.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text)' }}>{c.text}</span>
                <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: c.color }}>
                  {c.result}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Real-time Ambulance Telemetry */}
        <section
          className="card"
          style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}
          aria-label="Vehicle Telemetry"
        >
          <span className="lbl">Vehicle Dynamics</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Telemetry Stream</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', background: 'var(--surface-alt)', borderRadius: '2px' }}>
              <span className="lbl" style={{ fontSize: '10px' }}>Speed</span>
              <span className="mono" style={{ fontSize: '20px', fontWeight: 700 }}>
                {t >= 1 ? 0 : Math.round(46 + 10 * Math.sin(t * 24))} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>km/h</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', background: 'var(--surface-alt)', borderRadius: '2px' }}>
              <span className="lbl" style={{ fontSize: '10px' }}>Heading</span>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>
                {t >= 1 ? 'Stationary' : heading}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', background: 'var(--surface-alt)', borderRadius: '2px' }}>
              <span className="lbl" style={{ fontSize: '10px' }}>Remaining Dist</span>
              <span className="mono" style={{ fontSize: '20px', fontWeight: 700 }}>
                {((L - cur) * 0.0049).toFixed(1)} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>km</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', background: 'var(--surface-alt)', borderRadius: '2px' }}>
              <span className="lbl" style={{ fontSize: '10px' }}>AVLS Unit</span>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>AMB-017</span>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Anonymous AVLS identifier. Location and speed transmitted over encrypted telemetry channel.
          </span>
        </section>

        {/* Arterial Corridor Speeds */}
        <section
          className="card"
          style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}
          aria-label="Arterial Speeds"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lbl">Approach Congestion</span>
            <button
              type="button"
              onClick={() => onNavigate('perception')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              CCTV Feeds →
            </button>
          </div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Segment Speeds</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {segments.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '90px', color: 'var(--text-secondary)', flexShrink: 0 }}>{s.name}</span>
                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: s.color, width: s.w }} />
                </div>
                <span className="mono" style={{ width: '60px', textAlign: 'right', fontWeight: 600 }}>
                  {s.speed} km/h
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
