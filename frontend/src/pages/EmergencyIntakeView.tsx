import React, { useEffect, useState } from 'react';
import { apiService, EmergencyRecord, HospitalRoute } from '../services/api';
import { Shield, AlertCircle, PhoneCall, Activity, ChevronRight, X } from 'lucide-react';
import { Incoming1122Request } from './EmergenciesView';

export type EmergencySource = '1122' | 'anomaly';

interface EmergencyIntakeViewProps {
  initialSource: EmergencySource;
  initialRequest?: Incoming1122Request;
  presentation?: 'dialog' | 'page';
  onCreated: (emergency: EmergencyRecord) => void;
  onCancel?: () => void;
}

const sourceDetails: Record<EmergencySource, { label: string; location: string; type: string; notes: string }> = {
  '1122': {
    label: 'Punjab 1122 Dispatch',
    location: '',
    type: 'Cardiac arrest',
    notes: '',
  },
  anomaly: {
    label: 'Automated Trajectory Anomaly',
    location: 'Canal Underpass / Ferozepur Road',
    type: 'Traffic obstruction',
    notes: 'System alert: traffic anomaly detected near I3. Operator verification required.',
  },
};

export const EmergencyIntakeView: React.FC<EmergencyIntakeViewProps> = ({
  initialSource,
  initialRequest,
  presentation = 'dialog',
  onCreated,
  onCancel,
}) => {
  const [source, setSource] = useState(initialSource);
  const [priority, setPriority] = useState(initialRequest?.priority ?? 'P1');
  const [ambulance, setAmbulance] = useState(initialRequest?.ambulance ?? 'AMB-017');
  const [location, setLocation] = useState(initialRequest?.location ?? sourceDetails[initialSource].location);
  const [type, setType] = useState(initialRequest?.type ?? sourceDetails[initialSource].type);
  const [notes, setNotes] = useState(initialRequest?.notes ?? sourceDetails[initialSource].notes);
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
        notes: [sourceNote, initialRequest ? `Dispatch request: ${initialRequest.id}` : '', notes.trim()].filter(Boolean).join(' · '),
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
  const formatCostTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div
      role={isPage ? undefined : 'dialog'}
      aria-modal={isPage ? undefined : true}
      aria-labelledby="emergency-intake-title"
      style={
        isPage
          ? {
              minHeight: '100vh',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px 24px',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontFamily: "'Public Sans', Inter, system-ui, sans-serif",
            }
          : {
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
              background: 'rgba(11, 12, 12, 0.65)', // Solid backdrop with NO blur
            }
      }
    >
      {isPage && (
        <div style={{ width: '100%', maxWidth: '1440px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              background: 'var(--navy-800)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--accent-gold)',
            }}
          >
            <Shield size={20} strokeWidth={1.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>Emergency Green Corridor System</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Emergency Intake & Dispatch Authorization · PSCA PPIC3 Protocol
            </span>
          </div>
        </div>
      )}

      <div
        className={`emergency-intake-layout ${isPage ? 'emergency-intake-page' : 'emergency-intake-dialog'}`}
        style={{
          width: '100%',
          maxWidth: isPage ? '1440px' : '1100px',
          maxHeight: isPage ? undefined : '90vh',
          overflowY: isPage ? undefined : 'auto',
        }}
      >
        {/* Left Card: Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            minWidth: 0,
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Call Intake & Preemption Authorization</span>
              <h2 id="emergency-intake-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
                Register Incident for Corridor Creation
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Enter verified dispatch details or confirm system-detected trajectory anomalies.
              </span>
            </div>
            {!isPage && (
              <button
                type="button"
                className="btn-g"
                onClick={() => onCancel?.()}
                aria-label="Close dialog"
                style={{ padding: '0 10px', minHeight: '34px' }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {initialRequest && (
            <div style={{ padding: '10px 12px', borderLeft: '3px solid var(--primary)', background: 'var(--navy-50)', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Details prefilled from 1122 dispatch request <strong className="mono">{initialRequest.id}</strong>. Verify the incident details and select a hospital before authorizing.
            </div>
          )}

          {!initialRequest && (
            <div role="group" aria-label="Incident Source" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {(['1122', 'anomaly'] as EmergencySource[]).map((value) => {
                const isSel = source === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`pick ${isSel ? 'pick-on' : ''}`}
                    onClick={() => changeSource(value)}
                    aria-pressed={isSel}
                    style={{
                      flex: '1 1 200px',
                      padding: '10px 14px',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {value === '1122' ? <PhoneCall size={18} strokeWidth={1.5} style={{ color: 'var(--primary)' }} /> : <Activity size={18} strokeWidth={1.5} style={{ color: 'var(--warning)' }} />}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{sourceDetails[value].label}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                          {value === '1122' ? 'Direct 1122 emergency operator call' : 'Real-time trajectory obstruction warning'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="lbl">Incident / Pickup Location</span>
            <input
              className="field"
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Kalma Chowk Underpass / Ferozepur Road"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="lbl">Medical Emergency Category</span>
            <select className="field" value={type} onChange={(event) => setType(event.target.value)}>
              <option>Cardiac arrest</option>
              <option>Stroke</option>
              <option>Major trauma</option>
              <option>Traffic obstruction</option>
              <option>Other time-critical case</option>
            </select>
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <label style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Priority Class</span>
              <select className="field" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="P1">P1 · Critical (Immediate Corridor)</option>
                <option value="P2">P2 · Urgent (Coordinated Green)</option>
                <option value="P3">P3 · Standard Priority</option>
              </select>
            </label>
            <label style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="lbl">Assigned Emergency Vehicle</span>
              <select className="field" value={ambulance} onChange={(event) => setAmbulance(event.target.value)}>
                <option value="AMB-017">AMB-017 · Model Toyota HiAce (Available)</option>
                <option value="AMB-022">AMB-022 · Model Mercedes Sprinter (Available)</option>
                <option value="AMB-009">AMB-009 · Available En-Route</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="lbl">Operator Notes & Patient Status</span>
            <input
              className="field"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Patient details, telemetry or on-site notes"
            />
          </label>

          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--danger)',
                fontSize: '13px',
                padding: '8px 12px',
                borderRadius: '4px',
                background: 'rgba(212, 53, 28, 0.08)',
                border: '1px solid rgba(212, 53, 28, 0.25)',
              }}
            >
              <AlertCircle size={16} strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            {initialRequest ? (
              <button type="button" className="btn-g" onClick={() => onCancel?.()}>
                Back to Emergencies
              </button>
            ) : !isPage && (
              <button type="button" className="btn-g" onClick={() => onCancel?.()}>
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-p"
              disabled={isSubmitting || !location.trim() || isLoadingHospitals || !selectedHospital}
            >
              {isSubmitting ? 'Initializing Corridor...' : 'Authorize Emergency & Build Corridor'}
            </button>
          </div>
        </form>

        {/* Right Card: AI Destination & Route Prediction */}
        <section
          className="card"
          aria-label="AI Hospital Recommendations"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            minWidth: 0,
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="lbl">Destination Optimization</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                AI Destination Recommendation
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Ranked by dynamic travel time, signal delays and live arterial congestion.
              </span>
            </div>
            <span className="chip c-blue">Traffic-Aware Ranking</span>
          </div>

          {isLoadingHospitals && (
            <div role="status" style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px 0' }}>
              Calculating real-time route costs for {type}…
            </div>
          )}
          {hospitalError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--danger)',
                padding: '8px 12px',
                borderRadius: '4px',
                background: 'rgba(212, 53, 28, 0.08)',
                border: '1px solid rgba(212, 53, 28, 0.25)',
              }}
            >
              <AlertCircle size={16} strokeWidth={1.5} />
              <span>{hospitalError}</span>
            </div>
          )}

          {!isLoadingHospitals && hospitals.length > 0 && (
            <div role="group" aria-label="Select destination hospital" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hospitals.map((hospital) => {
                const isSelected = selectedHospitalId === hospital.id;
                const isRank1 = hospital.rank === 1;
                return (
                  <button
                    type="button"
                    key={hospital.id}
                    className={`pick ${isSelected ? 'pick-on' : ''}`}
                    onClick={() => setSelectedHospitalId(hospital.id)}
                    aria-pressed={isSelected}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <span
                        className="mono"
                        style={{
                          width: '26px',
                          height: '26px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '2px',
                          background: isRank1 ? 'var(--navy-800)' : 'var(--surface-alt)',
                          color: isRank1 ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '13px',
                          border: isRank1 ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        {hospital.rank}
                      </span>
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                          {hospital.name}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {hospital.dist} km · {hospital.tags}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: '15px',
                          color: isRank1 ? 'var(--success)' : 'var(--text)',
                        }}
                      >
                        {formatTime(hospital.total_sec)}
                      </span>
                      <span className={`chip ${isRank1 ? 'c-green' : 'c-gray'}`}>
                        {isRank1 ? 'RECOMMENDED' : 'ALTERNATIVE'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedHospital && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '14px',
                borderRadius: '4px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                  Selected Target: <strong>{selectedHospital.name}</strong>
                </span>
                <button
                  type="button"
                  className="btn-g"
                  aria-expanded={showHospitalDetails}
                  onClick={() => setShowHospitalDetails((current) => !current)}
                  style={{ minHeight: '32px', fontSize: '12px', padding: '0 10px' }}
                >
                  {showHospitalDetails ? 'Hide Cost Breakdown' : 'View Cost Breakdown'}
                </button>
              </div>

              {showHospitalDetails && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <span className="lbl">Cost Function Rationale</span>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                        Why this route? Objective Function Cost Breakdown
                      </h3>
                    </div>
                    <span className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {formatCostTime(selectedHospital.total_sec)} Total Route Cost
                    </span>
                  </div>

                  <div style={{ display: 'flex', height: '12px', borderRadius: '2px', overflow: 'hidden', background: 'var(--border-subtle)' }}>
                    {[
                      { value: selectedHospital.travel_time_sec, color: 'var(--primary)' },
                      { value: selectedHospital.cong_penalty_sec, color: 'var(--warning)' },
                      { value: selectedHospital.signal_delay_sec, color: 'var(--navy-600)' },
                    ].map((cost, index) => (
                      <div
                        key={index}
                        style={{
                          height: '100%',
                          width: `${(cost.value / selectedHospital.total_sec) * 100}%`,
                          background: cost.color,
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                    {[
                      { label: 'Free-flow Travel Time', value: selectedHospital.travel_time_sec, color: 'var(--primary)' },
                      { label: 'Traffic Congestion Delay', value: selectedHospital.cong_penalty_sec, color: 'var(--warning)' },
                      { label: 'Intersection Hold Delay', value: selectedHospital.signal_delay_sec, color: 'var(--navy-600)' },
                    ].map((cost) => (
                      <div key={cost.label} style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: cost.color }} />
                          {cost.label}
                        </span>
                        <span className="mono" style={{ fontSize: '16px', fontWeight: 700 }}>
                          {formatCostTime(cost.value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Cost formula: <code>Cost(e) = T_travel(e) + W_cong · Delay_cong(e) + W_sig · Delay_sig(e)</code>.
                    Evaluated by the traffic-weighted A* solver with live TraCI speed feedback.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
