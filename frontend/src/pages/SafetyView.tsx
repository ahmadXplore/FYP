import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const SafetyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'ok' | 'no' | 'wait'>('all');
  const [auth, setAuth] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({
    a1: 'pending',
    a2: 'pending'
  });
  const [auditList, setAuditList] = useState<Array<{ time: string; junction: string; by: string; cmd: string; st: string; reason: string }>>([
    { time: '16:12:48', junction: 'I1', by: 'Corridor engine', cmd: 'Green priority, hold 25 s', st: 'ok', reason: 'All checks passed.' },
    { time: '16:12:31', junction: 'I1', by: 'PPO controller', cmd: 'Extend green +22 s', st: 'no', reason: 'Exceeds maximum red for the cross street.' },
    { time: '16:12:12', junction: 'I2', by: 'Corridor engine', cmd: 'Shorten cross phase by 8 s', st: 'ok', reason: 'Minimum green kept, pedestrian phase protected.' },
    { time: '16:11:57', junction: 'I2', by: 'OR-Tools optimiser', cmd: 'Skip pedestrian phase', st: 'no', reason: 'Protected pedestrian phase cannot be skipped.' },
    { time: '16:11:40', junction: 'I3', by: 'Corridor engine', cmd: 'Prepare: clear approach, hold 18 s', st: 'wait', reason: 'Valid. Waiting for operator authorisation.' },
    { time: '16:11:22', junction: 'I3', by: 'Agentic planner', cmd: 'Open all four approaches green', st: 'no', reason: 'Conflicting greens detected.' },
    { time: '16:10:58', junction: 'I4', by: 'Corridor engine', cmd: 'Reserve green slot', st: 'ok', reason: 'All checks passed.' },
    { time: '16:10:41', junction: 'I1', by: 'Corridor engine', cmd: 'Restore normal plan', st: 'ok', reason: 'Ambulance cleared the junction.' }
  ]);

  useEffect(() => {
    const fetchSafety = async () => {
      const res = await apiService.getSafety();
      if (res && res.queue) {
        const qState: Record<string, 'pending' | 'approved' | 'rejected'> = {};
        res.queue.forEach((item: any) => {
          qState[item.id] = item.status;
        });
        setAuth(qState);
      }
    };
    fetchSafety();
  }, []);

  const handleAuthorize = async (id: string) => {
    setAuth((prev) => ({ ...prev, [id]: 'approved' }));
    await apiService.authorizeCommand(id);
    setAuditList((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        junction: id === 'a1' ? 'I3' : 'I4',
        by: 'PSCA Operator',
        cmd: id === 'a1' ? 'Authorised green priority' : 'Authorised green slot',
        st: 'ok',
        reason: 'Authorised manually by PSCA operator.'
      },
      ...prev
    ]);
  };

  const handleReject = async (id: string) => {
    setAuth((prev) => ({ ...prev, [id]: 'rejected' }));
    await apiService.rejectCommand(id);
    setAuditList((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        junction: id === 'a1' ? 'I3' : 'I4',
        by: 'PSCA Operator',
        cmd: id === 'a1' ? 'Rejected green priority' : 'Rejected green slot',
        st: 'no',
        reason: 'Rejected manually by PSCA operator override.'
      },
      ...prev
    ]);
  };

  const R: Record<string, { cls: string; label: string }> = {
    ok: { cls: 'c-green', label: 'APPROVED' },
    no: { cls: 'c-red', label: 'REJECTED' },
    wait: { cls: 'c-amber', label: 'AWAITING' }
  };

  const rows = auditList.filter((r) => filter === 'all' || r.st === filter);
  const pendingAuth = Object.values(auth).filter((v) => v === 'pending').length;

  const filters = [
    { id: 'all' as const, label: 'All' },
    { id: 'ok' as const, label: 'Approved' },
    { id: 'no' as const, label: 'Rejected' },
    { id: 'wait' as const, label: 'Awaiting' }
  ];

  const rules = [
    { name: 'Valid phase sequence', hits: '151 / 151' },
    { name: 'Minimum green and maximum red respected', hits: '150 / 151' },
    { name: 'No conflicting greens', hits: '150 / 151' },
    { name: 'Protected pedestrian phases', hits: '150 / 151' },
    { name: 'Cross-traffic impact within limit', hits: '151 / 151' },
    { name: 'Permitted emergency override only', hits: '151 / 151' }
  ];

  const renderQueueItem = (id: string, title: string, detail: string) => {
    const v = auth[id] || 'pending';
    return (
      <div
        key={id}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '12px',
          background: '#0F1A2E',
          border: '1px solid #243350',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: '1 1 240px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{title}</span>
          <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.45 }}>{detail}</span>
        </div>

        {v === 'pending' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-no"
              onClick={() => handleReject(id)}
            >
              Reject
            </button>
            <button
              type="button"
              className="btn-ok"
              onClick={() => handleAuthorize(id)}
            >
              Authorise
            </button>
          </div>
        ) : (
          <span className={`chip ${v === 'approved' ? 'c-green' : 'c-red'}`}>
            {v === 'approved' ? 'AUTHORISED' : 'REJECTED BY OPERATOR'}
          </span>
        )}
      </div>
    );
  };

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Totals */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }} aria-label="Validation totals">
        <div className="card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Commands checked</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 600, lineHeight: 1 }}>151</span>
        </div>

        <div className="card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Approved</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 600, lineHeight: 1, color: '#34D3A8' }}>
            {146 + Object.values(auth).filter((v) => v === 'approved').length}
          </span>
        </div>

        <div className="card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Rejected</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 600, lineHeight: 1, color: '#FF7A7A' }}>
            {3 + Object.values(auth).filter((v) => v === 'rejected').length}
          </span>
        </div>

        <div className="card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="lbl">Awaiting operator</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 600, lineHeight: 1, color: '#F6B93B' }}>
            {pendingAuth}
          </span>
        </div>
      </section>

      {/* Rules & Queue */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Rules Card */}
        <section className="card" style={{ flex: '2 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Validation rules">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Validation rules</h2>
          {rules.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid #243350', fontSize: '14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D3A8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
                <path d="M5 12l5 5 9-10" />
              </svg>
              <span style={{ flex: 1 }}>{r.name}</span>
              <span className="mono" style={{ fontSize: '12px', color: '#A3B2CA' }}>{r.hits}</span>
            </div>
          ))}
        </section>

        {/* Operator Authorisation Queue */}
        <section className="card" style={{ flex: '3 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Operator authorisation queue">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Operator authorisation</h2>
            <span className="chip c-blue">Live use only</span>
          </div>
          <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.5 }}>
            Commands that passed validation wait here for a human before reaching a real signal. In the digital twin they are applied automatically.
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {renderQueueItem(
              'a1',
              'I3: prepare and hold green for AMB-017',
              'Proposed by corridor engine for T+04:44. Estimated cross-traffic delay +9 s, within limit.'
            )}
            {renderQueueItem(
              'a2',
              'I4: reserve green slot',
              'Proposed for T+06:29. Estimated cross-traffic delay +6 s, within limit.'
            )}
          </div>
        </section>
      </div>

      {/* Command Log */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Command log">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Command log</h2>
          <div role="group" aria-label="Filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`btn-g ${filter === f.id ? 'btn-on' : ''}`}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Junction</th><th>Proposed by</th><th>Command</th><th>Result</th><th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l, idx) => (
                <tr key={idx}>
                  <td className="mono" style={{ whiteSpace: 'nowrap', color: '#A3B2CA' }}>{l.time}</td>
                  <td style={{ fontWeight: 700 }}>{l.junction}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{l.by}</td>
                  <td>{l.cmd}</td>
                  <td><span className={`chip ${R[l.st].cls}`}>{R[l.st].label}</span></td>
                  <td style={{ color: '#A3B2CA', lineHeight: 1.45 }}>{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
