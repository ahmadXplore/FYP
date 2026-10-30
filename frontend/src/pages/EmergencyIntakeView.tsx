import React, { useEffect, useState } from 'react';
import { apiService, EmergencyRecord, HospitalRoute } from '../services/api';

export type EmergencySource = '1122' | 'anomaly';

interface EmergencyIntakeViewProps {
  initialSource: EmergencySource;
  presentation?: 'dialog' | 'page';
  onCreated: (emergency: EmergencyRecord) => void;
  onCancel?: () => void;
}

const sourceDetails: Record<EmergencySource, { label: string; location: string; type: string; notes: string }> = {
  '1122': {
    label: '1122 call',
    location: '',
    type: 'Cardiac arrest',
    notes: '',
  },
  anomaly: {
    label: 'System anomaly',
    location: 'Canal Underpass / Ferozepur Road',
    type: 'Traffic obstruction',
    notes: 'System alert: traffic anomaly detected near I3. Operator verification required.',
  },
};

export const EmergencyIntakeView: React.FC<EmergencyIntakeViewProps> = ({ initialSource, presentation = 'dialog', onCreated, onCancel }) => {
  const [source, setSource] = useState(initialSource);
  const [priority, setPriority] = useState('P1');
  const [ambulance, setAmbulance] = useState('AMB-017');
  const [location, setLocation] = useState(sourceDetails[initialSource].location);
  const [type, setType] = useState(sourceDetails[initialSource].type);
  const [notes, setNotes] = useState(sourceDetails[initialSource].notes);
  const [hospitals, setHospitals] = useState<HospitalRoute[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
  const [hospitalError, setHospitalError] = useState('');
  const [showHospitalDetails, setShowHospitalDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      setHospitalError('');
      try {
        const response = await apiService.getRouting(type);
        if (active) {
          setHospitals(response.hospitals);
          const recommended = response.hospitals.find((hospital) => hospital.rank === 1) || response.hospitals[0];
          setSelectedHospitalId(recommended?.id ?? '');
        }
      } catch (requestError) {
        if (active) {
          setHospitals([]);
          setSelectedHospitalId('');
          setHospitalError(requestError instanceof Error ? requestError.message : 'Could not load hospital predictions.');
        }
      } finally {
        if (active) setIsLoadingHospitals(false);
      }
    };
    fetchHospitals();
    return () => { active = false; };
  }, [type]);

  const selectedHospital = hospitals.find((hospital) => hospital.id === selectedHospitalId);

  const changeSource = (nextSource: EmergencySource) => {
    setSource(nextSource);
    setLocation(sourceDetails[nextSource].location);
    setType(sourceDetails[nextSource].type);
    setNotes(sourceDetails[nextSource].notes);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const sourceNote = source === '1122' ? 'Source: 1122' : 'Source: System anomaly';
      const response = await apiService.createEmergency({
        location,
        type,
        priority,
        ambulance,
        destination: selectedHospital?.name,
        notes: [sourceNote, notes.trim()].filter(Boolean).join(' · '),
      });
      const record = response.emergency;
      onCreated({
        id: record.id,
        type: record.type,
        priority: record.priority,
        pc: record.priority === 'P1' ? 'c-red' : record.priority === 'P2' ? 'c-amber' : 'c-blue',
        amb: record.ambulance,
        dest: record.destination,
        status: record.status,
        sc: 'c-green',
        time: record.time_str,
        location: record.caller_location,
        notes: record.notes,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Emergency could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPage = presentation === 'page';
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;

  return (
    <div
      role={isPage ? undefined : 'dialog'}
      aria-modal={isPage ? undefined : true}
      aria-labelledby="emergency-intake-title"
      style={isPage
        ? { minHeight: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', background: '#0B1220', color: '#E8EEF8', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }
        : { position: 'fixed', inset: 0, zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', background: 'rgba(5, 10, 20, .92)' }}
    >
      {isPage && (
        <div style={{ width: '100%', maxWidth: '1440px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <rect x="2" y="2" width="36" height="36" rx="10" fill="#34D3A8" />
            <path d="M9 20h22" stroke="#06231C" strokeWidth="3" strokeLinecap="round" />
            <circle cx="13" cy="20" r="3.4" fill="#06231C" />
            <circle cx="20" cy="20" r="3.4" fill="#06231C" />
            <circle cx="27" cy="20" r="3.4" fill="#06231C" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <strong>GreenCorridor AI</strong>
            <span style={{ fontSize: '12px', color: '#A3B2CA' }}>Emergency response command system</span>
          </div>
        </div>
      )}
      <div className={`emergency-intake-layout ${isPage ? 'emergency-intake-page' : 'emergency-intake-dialog'}`} style={{ width: '100%', maxWidth: isPage ? '1440px' : '1200px', maxHeight: isPage ? undefined : '90vh', overflowY: isPage ? undefined : 'auto' }}>
        <form onSubmit={handleSubmit} className="card emergency-create-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h2 id="emergency-intake-title" style={{ margin: 0, fontSize: '20px' }}>Start an emergency</h2>
              <span style={{ fontSize: '13px', color: '#A3B2CA' }}>Register details from a 1122 call or verify the sample system anomaly.</span>
            </div>
            {!isPage && <button type="button" className="btn-g" onClick={() => onCancel?.()}>Close</button>}
          </div>

          <div role="group" aria-label="Emergency source" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {(['1122', 'anomaly'] as EmergencySource[]).map((value) => (
              <button key={value} type="button" className={`pick ${source === value ? 'pick-on' : ''}`} onClick={() => changeSource(value)} aria-pressed={source === value} style={{ flex: '1 1 150px', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                <span style={{ fontWeight: 700 }}>{sourceDetails[value].label}</span>
                <span style={{ color: '#A3B2CA', fontSize: '12px' }}>{value === '1122' ? 'Enter dispatch details.' : 'Review the system traffic anomaly.'}</span>
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="lbl">Incident location</span>
            <input className="field" required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Enter address or junction" />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="lbl">Incident type</span>
            <select className="field" value={type} onChange={(event) => setType(event.target.value)}>
              <option>Cardiac arrest</option>
              <option>Stroke</option>
              <option>Major trauma</option>
              <option>Traffic obstruction</option>
              <option>Other time-critical case</option>
            </select>
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <label style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="lbl">Priority</span>
              <select className="field" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="P1">P1 · Critical</option>
                <option value="P2">P2 · Urgent</option>
                <option value="P3">P3 · Standard</option>
              </select>
            </label>
            <label style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="lbl">Assign ambulance</span>
              <select className="field" value={ambulance} onChange={(event) => setAmbulance(event.target.value)}>
                <option value="AMB-017">AMB-017 · Available</option>
                <option value="AMB-022">AMB-022 · Available</option>
                <option value="AMB-009">AMB-009 · Returning</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="lbl">Operator notes</span>
            <input className="field" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Patient or traffic details" />
          </label>

          {error && <div role="alert" style={{ color: '#FF7A7A', fontSize: '13px' }}>{error}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end' }}>
            {!isPage && <button type="button" className="btn-g" onClick={() => onCancel?.()}>Cancel</button>}
            <button type="submit" className="btn-p" disabled={isSubmitting || !location.trim() || isLoadingHospitals || !selectedHospital}>
              {isSubmitting ? 'Creating emergency…' : 'Create emergency'}
            </button>
          </div>
        </form>

        <section className="card hospital-ranking-card" aria-label="AI hospital recommendations" style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>AI hospital prediction</h2>
              <span style={{ fontSize: '13px', color: '#A3B2CA' }}>Ranked by predicted response time and live route costs.</span>
            </div>
            <span className="chip c-blue">Traffic-aware</span>
          </div>

          {isLoadingHospitals && <div role="status" style={{ fontSize: '13px', color: '#A3B2CA' }}>Calculating rankings for {type}…</div>}
          {hospitalError && <div role="alert" style={{ fontSize: '13px', color: '#FF7A7A' }}>{hospitalError}</div>}

          {!isLoadingHospitals && hospitals.length > 0 && (
            <div role="group" aria-label="Select destination hospital" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hospitals.map((hospital) => {
                const isSelected = selectedHospitalId === hospital.id;
                return (
                  <button
                    type="button"
                    key={hospital.id}
                    className={`pick ${isSelected ? 'pick-on' : ''}`}
                    onClick={() => setSelectedHospitalId(hospital.id)}
                    aria-pressed={isSelected}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '12px', textAlign: 'left' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span className="mono" style={{ width: '28px', height: '28px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: hospital.rank === 1 ? '#34D3A8' : '#243350', color: hospital.rank === 1 ? '#06231C' : '#E8EEF8', fontWeight: 700 }}>{hospital.rank}</span>
                      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 700 }}>{hospital.name}</span>
                        <span style={{ fontSize: '12px', color: '#A3B2CA' }}>{hospital.dist} km · {hospital.tags}</span>
                      </span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flex: 'none' }}>
                      <span className="mono" style={{ fontWeight: 700, color: hospital.rank === 1 ? '#34D3A8' : '#E8EEF8' }}>{formatTime(hospital.total_sec)}</span>
                      <span className={`chip ${hospital.rank === 1 ? 'c-green' : 'c-gray'}`}>{hospital.rank === 1 ? 'AI RECOMMENDED' : 'ALTERNATIVE'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedHospital && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', borderRadius: '10px', background: '#0F1A2E', border: '1px solid #243350' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px' }}>Selected: <strong>{selectedHospital.name}</strong></span>
                <button type="button" className="btn-g" aria-expanded={showHospitalDetails} onClick={() => setShowHospitalDetails((current) => !current)}>
                  {showHospitalDetails ? 'Hide other details' : 'Other details'}
                </button>
              </div>
              {showHospitalDetails && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.5 }}>{selectedHospital.insight}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                    {[
                      { label: 'Travel', value: formatTime(selectedHospital.travel_time_sec) },
                      { label: 'Traffic delay', value: formatTime(selectedHospital.cong_penalty_sec) },
                      { label: 'Signal delay', value: formatTime(selectedHospital.signal_delay_sec) },
                      { label: 'Shortest route', value: formatTime(selectedHospital.short_dist_sec) },
                      { label: 'Distance', value: `${selectedHospital.dist} km` },
                      { label: 'Capacity', value: selectedHospital.cap },
                    ].map((detail) => (
                      <div key={detail.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '9px', borderRadius: '8px', background: '#121C2F' }}>
                        <span className="lbl">{detail.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
