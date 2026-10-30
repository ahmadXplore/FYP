import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Sidebar';
import { apiService, EmergencyRecord, HospitalRoute } from '../services/api';
import { EmergencyIntakeView, EmergencySource } from './EmergencyIntakeView';

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

  const STY: Record<string, { color: string; cls: string; label: string; action: string; ring: string }> = {
    green: { color: '#34D3A8', cls: 'c-green', label: 'GREEN · PRIORITY', action: 'Priority green held until the ambulance has cleared.', ring: '1' },
    prep: { color: '#F6B93B', cls: 'c-amber', label: 'PREPARING', action: 'Predicting queue, shortening the cross-street phase, clearing the approach.', ring: '0' },
    monitor: { color: '#7F90AB', cls: 'c-gray', label: 'MONITOR', action: 'Monitoring. A green slot is reserved for the arrival time.', ring: '0' },
    cleared: { color: '#6AAEFF', cls: 'c-blue', label: 'RESTORED', action: 'Ambulance cleared. Back on the normal signal plan.', ring: '0' }
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
      ring: o.ring,
      eta: st === 'cleared' ? 'passed' : fmt(eta(d)),
      state: st,
      d
    };
  });

  // Decision feed
  const evs: Array<{ t: number; tag: string; dot: string; text: string }> = [
    { t: 0, tag: 'REQUEST', dot: '#6AAEFF', text: 'Emergency request received: cardiac arrest, priority P1, AMB-017 assigned.' },
    { t: 0.01, tag: 'ROUTING', dot: '#F6B93B', text: 'Jinnah Hospital selected by predicted travel time. Traffic-aware A* route computed across 4 intersections.' },
    { t: 0.02, tag: 'SAFETY', dot: '#34D3A8', text: 'I1 green priority approved: minimum green, pedestrian phase and conflict checks passed.' }
  ];

  defs.forEach((j) => {
    const d = cum[j.wp];
    const tPrep = Math.max(0.03, (d - 60 / TOTAL * L) / L);
    const tGreen = Math.max(0.03, (d - 20 / TOTAL * L) / L);
    const tClear = (d + 25) / L;
    if (j.id !== 'I1') {
      evs.push({ t: tPrep, tag: 'CORRIDOR', dot: '#F6B93B', text: j.id + ' preparing: predicted queue is being cleared and the cross-street phase shortened.' });
      evs.push({ t: tGreen, tag: 'SAFETY', dot: '#34D3A8', text: j.id + ' green priority validated and applied.' });
    }
    evs.push({ t: tClear, tag: 'RESTORE', dot: '#A3B2CA', text: j.id + ' returned to the normal signal plan.' });
  });

  evs.push({ t: 0.999, tag: 'ARRIVAL', dot: '#6AAEFF', text: 'AMB-017 arrived at Jinnah Hospital. Corridor closed and logged.' });
  if (incident) {
    evs.push({ t: incidentAt, tag: 'INCIDENT', dot: '#FF7A7A', text: 'Incident detected ahead of I3. Route recomputed and the I3 hold extended.' });
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
    { text: 'Valid phase sequence', ok: true },
    { text: 'Minimum green respected', ok: true },
    { text: 'No conflicting greens', ok: true },
    { text: 'Pedestrian phase protected', ok: true },
    { text: incident ? 'I3 cross-traffic delay over limit' : 'Cross-traffic impact within limit', ok: !incident }
  ].map((c) => ({
    text: c.text,
    color: c.ok ? '#34D3A8' : '#FF7A7A',
    result: c.ok ? 'PASS' : 'ADJUSTED',
    icon: c.ok ? 'M5 12l5 5 9-10' : 'M12 8v5M12 17h.01M12 3l10 18H2z'
  }));

  const segments = [
    { name: 'Start → I1', speed: 38, w: '76%', color: '#34D3A8' },
    { name: 'I1 → I2', speed: 24, w: '48%', color: '#F6B93B' },
    { name: 'I2 → I3', speed: incident ? 12 : 31, w: incident ? '24%' : '62%', color: incident ? '#FF7A7A' : '#34D3A8' },
    { name: 'I3 → Hospital', speed: 29, w: '58%', color: '#34D3A8' }
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

      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Emergency command center">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span className="lbl">Emergency operations</span>
            <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 700 }}>Incoming and active emergencies</h2>
          </div>
          <button
            type="button"
            className="btn-p"
            onClick={() => {
              setIntakeSource('1122');
              setShowIntake(true);
            }}
          >
            Register 1122 call
          </button>
        </div>

        {emergencyError && <div role="alert" className="card" style={{ color: '#FF7A7A' }}>{emergencyError}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
          <section className="card" style={{ flex: '2 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Selected emergency details">
            {selectedEmergency ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className="lbl">Selected emergency · {emergencySource(selectedEmergency.notes)}</span>
                    <h3 style={{ margin: 0, fontSize: '20px' }}>{selectedEmergency.type}</h3>
                    <span className="mono" style={{ fontSize: '13px', color: '#A3B2CA' }}>{selectedEmergency.id} · reported {selectedEmergency.time}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={`chip ${selectedEmergency.pc}`}>{selectedEmergency.priority}</span>
                    <span className={`chip ${selectedEmergency.sc}`}>{selectedEmergency.status}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Incident location', value: selectedEmergency.location },
                    { label: 'Assigned ambulance', value: selectedEmergency.amb },
                    { label: 'Destination hospital', value: selectedEmergency.dest },
                  ].map((detail) => (
                    <div key={detail.label} style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '12px', borderRadius: '10px', background: '#0F1A2E' }}>
                      <span className="lbl">{detail.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{detail.value || 'Not specified'}</span>
                    </div>
                  ))}
                </div>

                {selectedEmergency.notes && (
                  <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#A3B2CA' }}>
                    <b style={{ color: '#E8EEF8' }}>Operator notes: </b>{selectedEmergency.notes.replace(/^Source: (1122|System anomaly)\s*·?\s*/, '') || 'None'}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                  <button type="button" className="btn-p" onClick={handleGenerateCorridor}>
                    {corridorReady ? 'Refresh green corridor' : 'Generate green corridor'}
                  </button>
                  {corridorReady && (
                    <button type="button" className="btn-g" onClick={() => onNavigate('corridor')}>Open corridor planner</button>
                  )}
                  {corridorError && <span role="alert" style={{ fontSize: '13px', color: '#FF7A7A' }}>{corridorError}</span>}
                </div>
                {corridorReady && corridorPlan && (
                  <div role="status" style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(52,211,168,.08)', border: '1px solid rgba(52,211,168,.3)', fontSize: '13px', lineHeight: 1.5 }}>
                    <b style={{ color: '#34D3A8' }}>Corridor plan ready for {selectedEmergency.id}.</b>
                    {' '}Recommended destination: {corridorPlan.name}; estimated route time {Math.ceil(corridorPlan.total_sec / 60)} min. The signal plan is available in the corridor planner.
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '130px', justifyContent: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{isLoadingEmergencies ? 'Loading emergency feed…' : 'No emergency selected'}</h3>
                <span style={{ color: '#A3B2CA', fontSize: '14px' }}>Register an incoming 1122 call or review a system anomaly to start an emergency.</span>
              </div>
            )}
          </section>

          <section className="card" style={{ flex: '1 1 280px', minWidth: 0, maxHeight: '320px', alignSelf: 'flex-start', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Emergency feed">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Emergency feed</h3>
              <span className="chip c-gray">{isLoadingEmergencies ? 'Loading' : `${activeEmergencyCount} active`}</span>
            </div>
            {emergencies.length > 0 ? (
              <div style={{ maxHeight: '232px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {emergencies.slice(0, 5).map((emergency) => (
                  <button
                    type="button"
                    key={emergency.id}
                    onClick={() => {
                      setSelectedEmergencyId(emergency.id);
                      setCorridorError('');
                    }}
                    aria-pressed={selectedEmergencyId === emergency.id}
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '9px', border: selectedEmergencyId === emergency.id ? '1px solid #34D3A8' : '1px solid #243350', background: selectedEmergencyId === emergency.id ? 'rgba(52,211,168,.08)' : '#0F1A2E', color: '#E8EEF8', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span className="mono" style={{ minWidth: '76px', fontSize: '12px' }}>{emergency.id}</span>
                    <span style={{ flex: '1 1 140px', fontSize: '13px' }}>{emergency.type} · {emergency.location}</span>
                    <span className={`chip ${emergency.pc}`}>{emergency.priority}</span>
                    <span className={`chip ${emergency.sc}`}>{emergency.status}</span>
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: '#A3B2CA' }}>{isLoadingEmergencies ? 'Retrieving 1122 and operator reports…' : 'No recorded emergencies yet.'}</span>
            )}
          </section>
        </div>
      </section>

      {/* Key Indicators */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }} aria-label="Key indicators">
        <div className="card" style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Active emergency</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1 }}>{activeEmergencyCount}</span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>{selectedEmergency ? `${selectedEmergency.amb} · Priority ${selectedEmergency.priority} · ${selectedEmergency.type}` : 'No active ambulance dispatch'}</span>
        </div>

        <div className="card" style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">ETA to hospital</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1, color: '#34D3A8' }}>
            {fmt(rem)}
          </span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>Jinnah Hospital · baseline {fmt(base)}</span>
        </div>

        <div className="card" style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Time saved vs baseline</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1 }}>
            {fmt(base - rem)}
          </span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>Strategy A (normal signals), sample</span>
        </div>

        <div className="card" style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Junctions cleared</span>
          <span className="mono" style={{ fontSize: '34px', fontWeight: 600, lineHeight: 1 }}>
            {cleared}<span style={{ fontSize: '18px', color: '#A3B2CA' }}> / 4</span>
          </span>
          <span style={{ fontSize: '13px', color: '#A3B2CA' }}>Each restored to its normal plan after passing</span>
        </div>
      </section>

      {/* Main Grid: Map & Status */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Map Section */}
        <section
          className="card"
          style={{ flex: '2 1 620px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}
          aria-label="Live corridor map"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Live corridor map</h2>
              <span className="chip c-gray">Schematic view</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className="btn-g"
                onClick={() => setPlaying(!playing)}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={playing ? 'M7 4h4v16H7zM14 4h4v16h-4z' : 'M7 4l12 8-12 8z'} />
                </svg>
                {playing ? 'Pause' : 'Play'}
              </button>

              {[1, 2, 4].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`btn-g ${speed === v ? 'btn-on' : ''}`}
                  onClick={() => setSpeed(v)}
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
              >
                Restart
              </button>
            </div>
          </div>

          <svg
            viewBox="0 0 900 520"
            style={{ width: '100%', height: 'auto', borderRadius: '10px', background: '#0D1627', border: '1px solid #1B2B46' }}
            role="img"
            aria-label="Schematic corridor map"
          >
            <path d="M0 270 C 250 230, 600 300, 900 250" fill="none" stroke="#12304F" strokeWidth="26" opacity="0.8" />
            <g stroke="#1B2B46" strokeWidth="12" fill="none" strokeLinecap="round">
              <path d="M20 90H880M20 200H880M20 320H880M20 440H880" />
              <path d="M70 40V490M230 40V490M400 40V490M560 40V490M720 40V490M840 40V300" />
            </g>
            <g stroke="#0D1627" strokeWidth="1.5" strokeDasharray="8 10" fill="none" opacity="0.7">
              <path d="M20 90H880M20 200H880M20 320H880M20 440H880M70 40V490M230 40V490M400 40V490M560 40V490M720 40V490" />
            </g>
            <g fill="none" strokeLinecap="round" strokeWidth="8" opacity={cong ? 0.85 : 0}>
              <path d="M70 440V90" stroke="#FF7A7A" />
              <path d="M230 200V320" stroke="#FF7A7A" />
              <path d="M400 320H720" stroke="#F6B93B" />
              <path d="M560 200V90" stroke="#F6B93B" />
            </g>
            <polyline
              points="70,440 70,90 800,90"
              fill="none"
              stroke="#F6B93B"
              strokeWidth="3"
              strokeDasharray="9 8"
              strokeLinejoin="round"
              opacity={alt ? 0.9 : 0}
            />
            {alt && (
              <text x="86" y="270" fontFamily="'IBM Plex Sans', sans-serif" fontSize="12" fontWeight="600" fill="#F6B93B">
                Shortest route · congested
              </text>
            )}

            <polyline
              points="70,440 230,440 400,440 400,320 400,200 560,200 720,200 720,90 800,90"
              fill="none"
              stroke="#34D3A8"
              strokeWidth="10"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.22"
            />
            <polyline
              points={pts.join(' ')}
              fill="none"
              stroke="#34D3A8"
              strokeWidth="6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            <g transform="translate(70 440)">
              <circle r="9" fill="#0D1627" stroke="#FF7A7A" strokeWidth="2.5" />
              <text x="-4" y="30" fontFamily="'IBM Plex Sans', sans-serif" fontSize="12" fontWeight="600" fill="#A3B2CA">Incident</text>
            </g>

            <g transform="translate(800 72)">
              <rect width="40" height="36" rx="9" fill="#1E3A5F" />
              <text x="20" y="25" textAnchor="middle" fontFamily="'IBM Plex Sans', sans-serif" fontSize="20" fontWeight="700" fill="#E8EEF8">H</text>
              <text x="20" y="54" textAnchor="middle" fontFamily="'IBM Plex Sans', sans-serif" fontSize="12" fontWeight="600" fill="#A3B2CA">Jinnah Hospital</text>
            </g>

            <g fontFamily="'IBM Plex Sans', sans-serif" fontSize="12" fontWeight="700" textAnchor="middle">
              <circle cx="230" cy="440" r="22" fill="none" stroke={js[0].color} strokeWidth="2" opacity={js[0].ring} className="pulse" />
              <circle cx="230" cy="440" r="16" fill={js[0].color} stroke="#0D1627" strokeWidth="3" /><text x="230" y="444" fill="#0B1220">I1</text>
              <text x="230" y="476" fill="#E8EEF8" fontFamily="'IBM Plex Mono', monospace" fontSize="12">{js[0].eta}</text>

              <circle cx="400" cy="320" r="22" fill="none" stroke={js[1].color} strokeWidth="2" opacity={js[1].ring} className="pulse" />
              <circle cx="400" cy="320" r="16" fill={js[1].color} stroke="#0D1627" strokeWidth="3" /><text x="400" y="324" fill="#0B1220">I2</text>
              <text x="440" y="352" fill="#E8EEF8" fontFamily="'IBM Plex Mono', monospace" fontSize="12">{js[1].eta}</text>

              <circle cx="560" cy="200" r="22" fill="none" stroke={js[2].color} strokeWidth="2" opacity={js[2].ring} className="pulse" />
              <circle cx="560" cy="200" r="16" fill={js[2].color} stroke="#0D1627" strokeWidth="3" /><text x="560" y="204" fill="#0B1220">I3</text>
              <text x="560" y="236" fill="#E8EEF8" fontFamily="'IBM Plex Mono', monospace" fontSize="12">{js[2].eta}</text>

              <circle cx="720" cy="90" r="22" fill="none" stroke={js[3].color} strokeWidth="2" opacity={js[3].ring} className="pulse" />
              <circle cx="720" cy="90" r="16" fill={js[3].color} stroke="#0D1627" strokeWidth="3" /><text x="720" y="94" fill="#0B1220">I4</text>
              <text x="720" y="128" fill="#E8EEF8" fontFamily="'IBM Plex Mono', monospace" fontSize="12">{js[3].eta}</text>
            </g>

            {incident && (
              <g>
                <circle cx="640" cy="200" r="20" fill="none" stroke="#FF7A7A" strokeWidth="2" className="pulse" />
                <path d="M640 186l15 26h-30z" fill="#FF7A7A" stroke="#0D1627" strokeWidth="2" strokeLinejoin="round" />
                <path d="M640 195v9M640 208h.01" stroke="#0B1220" strokeWidth="2.4" strokeLinecap="round" />
              </g>
            )}

            <g transform={`translate(${ax.toFixed(1)} ${ay.toFixed(1)})`}>
              <circle r="14" fill="none" stroke="#FF7A7A" strokeWidth="2" className="pulse" />
              <rect x="-13" y="-13" width="26" height="26" rx="8" fill="#FFFFFF" stroke="#FF7A7A" strokeWidth="2" />
              <path d="M0 -6v12M-6 0h12" stroke="#E5484D" strokeWidth="3.2" strokeLinecap="round" />
            </g>
          </svg>

          {/* Controls below Map */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className={`btn-g ${cong ? 'btn-on' : ''}`}
                onClick={() => setCong(!cong)}
              >
                Congestion layer
              </button>
              <button
                type="button"
                className={`btn-g ${alt ? 'btn-on' : ''}`}
                onClick={() => setAlt(!alt)}
              >
                Shortest route
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
                {incident ? 'Clear incident' : 'Simulate incident ahead'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px', flex: '1 1 200px', maxWidth: '320px' }}>
              <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: '#243350', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: '#34D3A8', width: `${Math.round(t * 100)}%` }}></div>
              </div>
              <span className="mono" style={{ fontSize: '12px', color: '#A3B2CA' }}>{Math.round(t * 100)}%</span>
            </div>
          </div>

          {/* Incident Alert Banner */}
          {incident && (
            <div
              role="status"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255,122,122,.10)',
                border: '1px solid rgba(255,122,122,.4)',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', marginTop: '1px' }}>
                <path d="M12 3l10 18H2zM12 10v5M12 18h.01" />
              </svg>
              <span>
                <b style={{ color: '#FF7A7A' }}>Incident detected ahead of I3.</b> The route and corridor plan were recomputed and the I3 hold was extended. The safety layer re-validated every pending command.
              </span>
            </div>
          )}
        </section>

        {/* Right Side: Status and Feed */}
        <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Corridor status */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Corridor status">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Corridor status</h2>
              <button
                type="button"
                onClick={() => onNavigate('corridor')}
                style={{ fontSize: '13px', fontWeight: 600, color: '#34D3A8', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Open planner →
              </button>
            </div>

            {js.map((j) => (
              <div
                key={j.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#0F1A2E',
                  border: '1px solid #243350',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0B1220',
                        background: j.color,
                      }}
                    >
                      {j.id}
                    </span>
                    <span className={`chip ${j.cls}`}>{j.label}</span>
                  </div>
                  <span className="mono" style={{ fontSize: '14px', fontWeight: 600 }}>{j.eta}</span>
                </div>
                <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.4 }}>{j.action}</span>
              </div>
            ))}
          </section>

          {/* AI Decision Feed */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="AI decision feed">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>AI decision feed</h2>
              <span className="chip c-blue">Advisory only</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '250px' }}>
              {feed.map((e, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flex: 'none', background: e.dot }}></span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', lineHeight: 1.45 }}>{e.text}</span>
                    <span className="mono" style={{ fontSize: '11px', color: '#7F90AB' }}>{e.time} · {e.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Telemetry */}
        <section className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Ambulance telemetry">
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Ambulance telemetry</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Speed</span>
              <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>
                {t >= 1 ? 0 : Math.round(46 + 10 * Math.sin(t * 24))} <span style={{ fontSize: '13px', color: '#A3B2CA' }}>km/h</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Heading</span>
              <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>{t >= 1 ? 'Arrived' : heading}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Remaining</span>
              <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>
                {((L - cur) * 0.0049).toFixed(1)} <span style={{ fontSize: '13px', color: '#A3B2CA' }}>km</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Vehicle ID</span>
              <span className="mono" style={{ fontSize: '22px', fontWeight: 600 }}>AMB-017</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#7F90AB', lineHeight: 1.5 }}>
            Anonymous ID. Only location, speed, heading, timestamp and destination are used (AVLS).
          </span>
        </section>

        {/* Safety Layer */}
        <section className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Safety layer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Safety layer</h2>
            <button
              type="button"
              onClick={() => onNavigate('safety')}
              style={{ fontSize: '13px', fontWeight: 600, color: '#34D3A8', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Open log →
            </button>
          </div>
          {checks.map((c, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
                <path d={c.icon} />
              </svg>
              <span style={{ flex: 1 }}>{c.text}</span>
              <span className="mono" style={{ fontSize: '12px', color: c.color }}>{c.result}</span>
            </div>
          ))}
        </section>

        {/* Traffic on Route */}
        <section className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Traffic on route">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Traffic on route</h2>
            <button
              type="button"
              onClick={() => onNavigate('perception')}
              style={{ fontSize: '13px', fontWeight: 600, color: '#34D3A8', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Cameras →
            </button>
          </div>
          {segments.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ width: '92px', flex: 'none', color: '#A3B2CA' }}>{s.name}</span>
              <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: '#243350', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: s.color, width: s.w }}></div>
              </div>
              <span className="mono" style={{ width: '70px', textAlign: 'right', fontSize: '12px' }}>{s.speed} km/h</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};
