import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ShieldCheck, CheckCircle2, XCircle, Download, AlertTriangle, FileText, Check, X } from 'lucide-react';

export const SafetyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'ok' | 'no' | 'wait'>('all');
  const [auth, setAuth] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({
    a1: 'pending',
    a2: 'pending'
  });
  const [auditList, setAuditList] = useState<Array<{ time: string; junction: string; by: string; cmd: string; st: string; reason: string }>>([
    { time: '16:12:48', junction: 'I1', by: 'Corridor Engine', cmd: 'Green priority wave, hold 25 s', st: 'ok', reason: 'NFR1-1, NFR1-2, NFR1-3 verification passed. Clearance timings valid.' },
    { time: '16:12:31', junction: 'I1', by: 'PPO RL Controller', cmd: 'Extend green phase +22 s', st: 'no', reason: 'REJECTED: Exceeds max cross-street red limit (Rule NFR1-2). Protected pedestrian phase minimum clearance violated.' },
    { time: '16:12:12', junction: 'I2', by: 'Corridor Engine', cmd: 'Shorten cross phase by 8 s', st: 'ok', reason: 'Minimum cross-street green kept, pedestrian walk phase preserved.' },
    { time: '16:11:57', junction: 'I2', by: 'OR-Tools Optimiser', cmd: 'Skip pedestrian clearance phase', st: 'no', reason: 'REJECTED: Protected pedestrian clearance interval cannot be suppressed under any priority policy (Rule NFR1-4).' },
    { time: '16:11:40', junction: 'I3', by: 'Corridor Engine', cmd: 'Prepare: clear approach queue, hold 18 s', st: 'wait', reason: 'Validated by safety rules. Awaiting operator authorization before field controller actuation.' },
    { time: '16:11:22', junction: 'I3', by: 'Agentic Planner', cmd: 'Open all four approaches to green', st: 'no', reason: 'REJECTED: Conflicting vehicular green phases detected (Rule NFR1-1 conflict matrix violation).' },
    { time: '16:10:58', junction: 'I4', by: 'Corridor Engine', cmd: 'Reserve green wave slot', st: 'ok', reason: 'Slot reservation within allowable phase tolerance.' },
    { time: '16:10:41', junction: 'I1', by: 'Corridor Engine', cmd: 'Restore normal arterial cycle', st: 'ok', reason: 'Ambulance cleared detector loops. Safe transition to local cycle coordination.' }
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
        by: 'PSCA PPIC3 Officer',
        cmd: id === 'a1' ? 'Authorised green priority wave' : 'Authorised green slot hold',
        st: 'ok',
        reason: 'Authorized manually by PSCA control-room operator.'
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
        by: 'PSCA PPIC3 Officer',
        cmd: id === 'a1' ? 'Rejected green priority' : 'Rejected green slot hold',
        st: 'no',
        reason: 'Manually rejected by operator override. System reverted to local signal timing.'
      },
      ...prev
    ]);
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Junction', 'Proposed By', 'Command', 'Decision', 'Safety Reason'];
    const rows = auditList.map((r) => [
      r.time,
      r.junction,
      `"${r.by}"`,
      `"${r.cmd}"`,
      r.st.toUpperCase(),
      `"${r.reason}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `safety_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const R: Record<string, { cls: string; label: string }> = {
    ok: { cls: 'c-green', label: 'APPROVED' },
    no: { cls: 'c-red', label: 'REJECTED' },
    wait: { cls: 'c-amber', label: 'AWAITING' }
  };

  const rows = auditList.filter((r) => filter === 'all' || r.st === filter);
  const pendingAuth = Object.values(auth).filter((v) => v === 'pending').length;

  const filters = [
    { id: 'all' as const, label: 'All Log Entries' },
    { id: 'ok' as const, label: 'Approved Commands' },
    { id: 'no' as const, label: 'Rejected Invariants' },
    { id: 'wait' as const, label: 'Awaiting Authorization' }
  ];

  const rules = [
    { id: 'NFR1-1', name: 'Phase Sequence & No Conflicting Greens', hits: '151 / 151 Passed' },
    { id: 'NFR1-2', name: 'Minimum Green & Maximum Red Clearance Boundaries', hits: '150 / 151 (1 Violation Prevented)' },
    { id: 'NFR1-3', name: 'Mandatory Yellow & All-Red Transition Intervals', hits: '151 / 151 Passed' },
    { id: 'NFR1-4', name: 'Pedestrian Walk & Clearance Intervals Protected', hits: '150 / 151 (1 Violation Prevented)' },
    { id: 'NFR1-5', name: 'Cross-Arterial Spillback Queue Bounds', hits: '151 / 151 Passed' },
    { id: 'NFR1-6', name: 'Emergency Vehicle Override Authorization Policy', hits: '151 / 151 Passed' }
  ];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Full-width Safety Validator Status Banner (Rule requirement) */}
      <div
        role="region"
        aria-label="Safety Validator Real-Time Status"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '16px 20px',
          borderRadius: '4px',
          background: 'rgba(0, 112, 60, 0.08)',
          border: '1px solid rgba(0, 112, 60, 0.25)',
          borderLeft: '4px solid var(--success)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={20} strokeWidth={2} style={{ color: 'var(--success)' }} />
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
            SAFETY VALIDATOR STATUS: ONLINE · ALL SAFETY INVARIANTS ACTIVE
          </h2>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
          The rule-based safety engine guarantees that no AI timing action violates physical intersection safety rules.
          Every command must pass the 6 NFR1 invariant checks before issuance to TraCI or field signal controllers.
        </span>
      </div>

      {/* Validation Totals KPI Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} aria-label="Validation Totals">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Commands Audited</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>
            151
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            100% evaluated prior to actuation
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Approved & Executed</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, color: 'var(--success)' }}>
            {146 + Object.values(auth).filter((v) => v === 'approved').length}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Complied with all NFR1 rules
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Rejected Violations</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, color: 'var(--danger)' }}>
            {3 + Object.values(auth).filter((v) => v === 'rejected').length}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Hazardous timing actions intercepted
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="lbl">Operator Queue</span>
          <span className="mono" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, color: 'var(--warning)' }}>
            {pendingAuth}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Awaiting manual officer authorization
          </span>
        </div>
      </section>

      {/* Safety Rules & Operator Authorization Queue */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* NFR1 Rules Matrix */}
        <section
          className="card"
          style={{ flex: '2 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="NFR1 Invariant Rules Matrix"
        >
          <div>
            <span className="lbl">Deterministic Constraints</span>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
              NFR1 Safety Invariants
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rules.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <CheckCircle2 size={16} strokeWidth={1.5} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>{r.id}</span>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.hits}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Operator Authorisation Queue */}
        <section
          className="card"
          style={{ flex: '3 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Operator Authorisation Queue"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="lbl">Human-in-the-Loop Protocol</span>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                Operator Authorization Queue
              </h2>
            </div>
            <span className="chip c-blue">PPIC3 Control Protocol</span>
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Commands validated as safe by automated rules wait here for explicit human authorization
            before being transmitted to field controllers. In the digital twin, approval can be authorized or rejected manually below.
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Item 1 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '4px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: '1 1 240px', minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                  I3: Prepare and Hold Green Priority for AMB-017
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Proposed by Corridor Engine for T+04:44. Estimated cross-traffic delay +9 s (within allowable 30 s limit).
                </span>
              </div>

              {auth.a1 === 'pending' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-no" onClick={() => handleReject('a1')}>
                    Reject Command
                  </button>
                  <button type="button" className="btn-ok" onClick={() => handleAuthorize('a1')}>
                    Authorize Priority
                  </button>
                </div>
              ) : (
                <span className={`chip ${auth.a1 === 'approved' ? 'c-green' : 'c-red'}`}>
                  {auth.a1 === 'approved' ? 'AUTHORIZED BY OPERATOR' : 'REJECTED BY OPERATOR'}
                </span>
              )}
            </div>

            {/* Item 2 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '4px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: '1 1 240px', minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                  I4: Reserve Green Preemption Phase Slot
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Scheduled for T+06:29 arrival. Cross-arterial spillback risk: Minimal.
                </span>
              </div>

              {auth.a2 === 'pending' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-no" onClick={() => handleReject('a2')}>
                    Reject Command
                  </button>
                  <button type="button" className="btn-ok" onClick={() => handleAuthorize('a2')}>
                    Authorize Priority
                  </button>
                </div>
              ) : (
                <span className={`chip ${auth.a2 === 'approved' ? 'c-green' : 'c-red'}`}>
                  {auth.a2 === 'approved' ? 'AUTHORIZED BY OPERATOR' : 'REJECTED BY OPERATOR'}
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Safety & Actuation Command Log (Audit Console) */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Command Audit Log">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <span className="lbl">Tamper-Evident Safety Ledger</span>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
              Command Verification & Execution Audit Log
            </h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {/* Filter controls */}
            <div role="group" aria-label="Filter Audit Log" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`btn-g ${filter === f.id ? 'btn-on' : ''}`}
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  style={{ minHeight: '34px', padding: '0 10px', fontSize: '12px' }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Export-to-CSV button styled as secondary (Rule requirement) */}
            <button
              type="button"
              className="btn-g"
              onClick={handleExportCSV}
              style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px', gap: '6px' }}
            >
              <Download size={14} strokeWidth={1.5} />
              <span>Export Audit to CSV</span>
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Junction</th>
                <th>Proposed By</th>
                <th>Actuation Command</th>
                <th>Validator Decision</th>
                <th>Verification Reason & Invariants</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l, idx) => (
                <tr key={idx}>
                  <td className="mono" style={{ color: 'var(--text-secondary)' }}>{l.time}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{l.junction}</td>
                  <td>{l.by}</td>
                  <td style={{ fontWeight: 500 }}>{l.cmd}</td>
                  <td>
                    <span className={`chip ${R[l.st].cls}`} style={{ height: '20px', fontSize: '10px' }}>
                      {R[l.st].label}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.45, whiteSpace: 'normal', maxWidth: '420px' }}>
                    {l.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
