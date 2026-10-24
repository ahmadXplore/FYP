import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Sidebar';
import { apiService } from '../services/api';

interface EmergencyViewProps {
  onNavigate: (page: PageId) => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ onNavigate }) => {
  const [prio, setPrio] = useState('P1');
  const [amb, setAmb] = useState('AMB-017');
  const [location, setLocation] = useState('Model Town Link Road / Ferozepur Rd');
  const [type, setType] = useState('Cardiac arrest');
  const [notes, setNotes] = useState('Patient on portable monitor, cardiac arrest protocol active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priorities = [
    { id: 'P1', name: 'P1 · Critical', desc: 'Life-threatening, full corridor' },
    { id: 'P2', name: 'P2 · Urgent', desc: 'Serious, priority at junctions' },
    { id: 'P3', name: 'P3 · Standard', desc: 'Stable, route optimisation only' }
  ];

  const ambulances = [
    { id: 'AMB-017', note: '1.8 km from incident · crew of 3', status: 'AVAILABLE', chip: 'c-green' },
    { id: 'AMB-022', note: '3.1 km from incident · crew of 2', status: 'AVAILABLE', chip: 'c-green' },
    { id: 'AMB-009', note: 'Returning from a transfer', status: 'BUSY', chip: 'c-amber' }
  ];

  const steps = [
    'Traffic state acquired from CCTV and ITMS data',
    'Ambulance located from AVLS GPS and map-matched',
    'Most suitable hospital selected by predicted travel time',
    'Traffic-aware route computed, with arrival time at each intersection',
    'Green corridor planned: which signals, when to prepare, how long to hold',
    'Every command checked by the safety layer',
    'Progress monitored, with normal operation restored behind the vehicle'
  ];

  const [rows, setRows] = useState([
    { id: 'EM-0412', type: 'Cardiac arrest', priority: 'P1', pc: 'c-red', amb: 'AMB-017', dest: 'Jinnah Hospital', status: 'ACTIVE', sc: 'c-green', time: '16:09' },
    { id: 'EM-0411', type: 'Major trauma', priority: 'P2', pc: 'c-amber', amb: 'AMB-022', dest: 'Mayo Hospital', status: 'COMPLETED', sc: 'c-gray', time: '15:31' },
    { id: 'EM-0410', type: 'Stroke', priority: 'P1', pc: 'c-red', amb: 'AMB-009', dest: 'Services Hospital', status: 'COMPLETED', sc: 'c-gray', time: '14:48' }
  ]);

  useEffect(() => {
    const fetchEmergencies = async () => {
      const res = await apiService.getEmergencies();
      if (res && res.emergencies) {
        setRows(res.emergencies);
      }
    };
    fetchEmergencies();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await apiService.createEmergency({
      location,
      type,
      priority: prio,
      ambulance: amb,
      notes
    });
    setIsSubmitting(false);
    onNavigate('dashboard');
  };

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
      {/* Emergency Request Form */}
      <section className="card" style={{ flex: '3 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '22px' }} aria-label="Emergency request form">
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Emergency request</h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="loc" className="lbl">Incident location</label>
            <input
              id="loc"
              className="field"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Search address or drop a pin"
            />
          </div>
          <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="typ" className="lbl">Incident type</label>
            <select
              id="typ"
              className="field"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Cardiac arrest</option>
              <option>Stroke</option>
              <option>Major trauma</option>
              <option>Other time-critical case</option>
            </select>
          </div>
        </div>

        {/* Priority */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl" id="prio-l">Priority</span>
          <div role="group" aria-labelledby="prio-l" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {priorities.map((p) => {
              const on = prio === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`pick ${on ? 'pick-on' : ''}`}
                  style={{ flex: '1 1 160px', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
                  onClick={() => setPrio(p.id)}
                  aria-pressed={on}
                >
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{p.name}</span>
                  <span style={{ fontSize: '12px', color: '#A3B2CA' }}>{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assign Ambulance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl" id="amb-l">Assign ambulance</span>
          <div role="group" aria-labelledby="amb-l" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ambulances.map((a) => {
              const on = amb === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`pick ${on ? 'pick-on' : ''}`}
                  onClick={() => setAmb(a.id)}
                  aria-pressed={on}
                >
                  <span style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#121C2F', border: '1px solid #FF7A7A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF7A7A" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span className="mono" style={{ fontWeight: 600, fontSize: '14px' }}>{a.id}</span>
                    <span style={{ fontSize: '12px', color: '#A3B2CA' }}>{a.note}</span>
                  </span>
                  <span className={`chip ${a.chip}`}>{a.status}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dispatcher Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label htmlFor="notes" className="lbl">Dispatcher notes (optional)</label>
          <input
            id="notes"
            className="field"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. patient on ventilator, request cardiac unit"
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button type="button" onClick={handleDispatch} disabled={isSubmitting} className="btn-p">
            {isSubmitting ? 'Dispatching...' : 'Dispatch and plan corridor'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06231C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => onNavigate('routing')} className="btn-g">
            Preview route and hospital
          </button>
        </div>
      </section>

      {/* Right Column: What happens next */}
      <div style={{ flex: '2 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="What happens next">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>What happens next</h2>
          <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.5 }}>
            No operator has to open signals one by one. The pipeline runs automatically.
          </span>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((text, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', lineHeight: 1.4 }}>
                <span className="mono" style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(52,211,168,.14)', color: '#34D3A8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flex: 'none' }}>
                  {i + 1}
                </span>
                <span style={{ paddingTop: '3px' }}>{text}</span>
              </li>
            ))}
          </ol>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(106,174,255,.08)', border: '1px solid rgba(106,174,255,.3)', fontSize: '13px', lineHeight: 1.5, color: '#A3B2CA' }}>
            In live use, signal actions also need operator authorisation. In this prototype everything runs on the digital twin.
          </div>
        </section>
      </div>

      {/* Full width recent emergencies table */}
      <section className="card" style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Recent emergencies">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Active and recent emergencies</h2>
          <span className="chip c-gray">Sample data</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Type</th><th>Priority</th><th>Ambulance</th><th>Destination</th><th>Status</th><th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{r.type}</td>
                  <td><span className={`chip ${r.pc}`}>{r.priority}</span></td>
                  <td className="mono">{r.amb}</td>
                  <td>{r.dest}</td>
                  <td><span className={`chip ${r.sc}`}>{r.status}</span></td>
                  <td className="mono" style={{ color: '#A3B2CA' }}>{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
