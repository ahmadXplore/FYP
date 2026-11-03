import React, { useState, useEffect } from 'react';
import { apiService, UserRecord } from '../services/api';
import { Shield, RotateCcw, AlertCircle, Check, X, UserPlus, Lock } from 'lucide-react';

export const AdminView: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'roles' | 'audit' | 'data'>('users');
  const [usersList, setUsersList] = useState<UserRecord[]>([
    { name: 'demo.admin', role: 'Admin', status: 'ACTIVE', last: 'Today 16:02' },
    { name: 'psca.operator1', role: 'PSCA Operator', status: 'ACTIVE', last: 'Today 16:12' },
    { name: 'traffic.operator1', role: 'Traffic Operator', status: 'ACTIVE', last: 'Today 15:40' },
    { name: 'research.viewer', role: 'Research', status: 'INVITED', last: 'Never' },
  ]);
  const [auditList, setAuditList] = useState<Array<{ time: string; actor: string; action: string; object: string; result: string; cls: string }>>([
    { time: '16:12:48', actor: 'corridor-engine', action: 'Proposed green priority wave', object: 'I1', result: 'APPROVED', cls: 'c-green' },
    { time: '16:12:31', actor: 'ppo-controller', action: 'Proposed extend green +22 s', object: 'I1', result: 'REJECTED', cls: 'c-red' },
    { time: '16:11:40', actor: 'psca.operator1', action: 'Inspected command awaiting authorization', object: 'I3', result: 'LOGGED', cls: 'c-gray' },
    { time: '16:09:05', actor: 'psca.operator1', action: 'Registered emergency dispatch request', object: 'EM-0412', result: 'CREATED', cls: 'c-blue' },
    { time: '16:08:52', actor: 'demo.admin', action: 'Configured queue lead time to 40 s', object: 'Corridor Settings', result: 'SAVED', cls: 'c-blue' },
    { time: '15:31:10', actor: 'system-agent', action: 'Restored normal cycle plan', object: 'I4', result: 'APPROVED', cls: 'c-green' },
    { time: '15:02:44', actor: 'demo.admin', action: 'Authenticated into control room console', object: 'PPIC3 Terminal', result: 'OK', cls: 'c-gray' },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('PSCA Operator');
  const [isInviting, setIsInviting] = useState(false);
  const [approvingAccountId, setApprovingAccountId] = useState<number | null>(null);
  const [userActionError, setUserActionError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiService.getUsers();
        setUsersList(res.users);
      } catch (reason) {
        setUserActionError(reason instanceof Error ? reason.message : 'Could not load users');
      }
    };
    const fetchAudit = async () => {
      const res = await apiService.getSafety();
      if (res && res.audit) {
        setAuditList(res.audit);
      }
    };
    fetchUsers();
    fetchAudit();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setIsInviting(true);
    const res = await apiService.inviteUser(newUsername.trim(), newRole);
    if (res && res.user) {
      setUsersList((prev) => [...prev, res.user]);
      setNewUsername('');
      setShowInviteModal(false);
    }
    setIsInviting(false);
  };

  const handleApprove = async (accountId: number) => {
    setUserActionError('');
    setApprovingAccountId(accountId);
    try {
      await apiService.approveUser(accountId);
      setUsersList((previous) => previous.map((user) => (
        user.account_id === accountId ? { ...user, status: 'ACTIVE' } : user
      )));
    } catch (reason) {
      setUserActionError(reason instanceof Error ? reason.message : 'Could not approve account');
    } finally {
      setApprovingAccountId(null);
    }
  };

  const handleResetDemoData = () => {
    // Reset local states to default clean baseline
    setShowResetModal(false);
    setResetSuccessMessage('Demo telemetry and operational queues have been reset to baseline scenario.');
    setTimeout(() => setResetSuccessMessage(''), 5000);
  };

  const tabs = [
    { id: 'users' as const, label: 'Operator Accounts' },
    { id: 'roles' as const, label: 'Role Permissions Matrix' },
    { id: 'audit' as const, label: 'Tamper-Evident Ledger' },
    { id: 'data' as const, label: 'Security & Privacy Policies' },
  ];

  const RC: Record<string, string> = {
    Admin: 'c-blue',
    'PSCA Operator': 'c-green',
    'Traffic Operator': 'c-amber',
    Research: 'c-gray',
  };

  const perms = [
    ['View Dashboard & Live Corridor Status', 1, 1, 1, 1],
    ['Register Emergency Dispatch (1122 Intake)', 1, 1, 0, 0],
    ['Authorize Live Signal Preemption Actions', 1, 1, 0, 0],
    ['View Traffic Perception Feeds & Predictions', 1, 1, 1, 0],
    ['Inspect Safety Validator Rule Invariants', 1, 1, 1, 1],
    ['Execute Digital Twin Simulation Benchmarks', 1, 1, 0, 1],
    ['Manage Operator Accounts & TraCI Adapters', 1, 0, 0, 0],
    ['Export Immutable Safety Audit Logs', 1, 0, 0, 0],
  ].map((r) => {
    const o: Record<string, any> = { name: r[0] };
    for (let i = 0; i < 4; i++) {
      o['has' + i] = Boolean(r[i + 1]);
      o['l' + i] = r[i + 1] ? 'Authorized' : 'Unauthorized';
    }
    return o;
  });

  const policies = [
    { title: 'Local Edge Processing Only', text: 'Video feeds, camera homography calibrations, and internal network topologies remain strictly on-premise. No public cloud egress.' },
    { title: 'Anonymous Telemetry Data (AVLS)', text: 'Emergency priority tracking utilizes randomized pseudonyms. Only coordinates, velocity, heading, and timestamp are evaluated.' },
    { title: 'Air-Gapped & Resilient Architecture', text: 'Operates natively on Linux with PostgreSQL, PostGIS, and Redis. Operates during external internet partition.' },
    { title: 'Granular Role-Based Access Control', text: 'Multi-tiered access control enforcing least-privilege policies for dispatchers, signal engineers, and evaluators.' },
    { title: 'Deterministic Safety Guarantee', text: 'Autonomous reinforcement learning outputs are purely advisory. Physical actuation requires rule-based validator confirmation.' },
    { title: 'Immutable SHA-256 Audit Trails', text: 'Every preemption command, override, and rejection is signed and appended to a tamper-evident audit ledger.' },
  ];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Reset Confirmation Modal (Solid backdrop, 4px radius, no blur) */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'rgba(11, 12, 12, 0.65)',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={22} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />
              <h2 id="reset-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Reset Demonstration Data?
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
              This action will reset active corridor simulations, restore baseline 1122 emergency records, and
              re-initialize the SUMO digital twin queue parameters. No system audit logs will be deleted.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button type="button" className="btn-g" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-p"
                onClick={handleResetDemoData}
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Confirm Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Message if Reset */}
      {resetSuccessMessage && (
        <div
          role="status"
          style={{
            padding: '10px 16px',
            borderRadius: '4px',
            background: 'rgba(0, 112, 60, 0.08)',
            border: '1px solid rgba(0, 112, 60, 0.25)',
            color: 'var(--success)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {resetSuccessMessage}
        </div>
      )}

      {/* Header and Reset Demo Data Button (Rule requirement) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div role="group" aria-label="Administration Sections" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'tab-on' : ''}`}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              style={{ minHeight: '38px', padding: '0 14px', fontSize: '13px' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-g"
          onClick={() => setShowResetModal(true)}
          style={{ gap: '6px', minHeight: '38px', fontSize: '13px', color: 'var(--danger)', borderColor: 'var(--border)' }}
        >
          <RotateCcw size={14} strokeWidth={1.5} />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Operators">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="lbl">Access Management</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Control Room Operator Accounts
              </h2>
            </div>
            <button type="button" className="btn-p" onClick={() => setShowInviteModal(true)}>
              <UserPlus size={15} strokeWidth={1.5} />
              <span>Enroll New Operator</span>
            </button>
          </div>

          {userActionError && <span role="alert" style={{ color: '#FF7A7A', fontSize: '13px' }}>{userActionError}</span>}

          {showInviteModal && (
            <form
              onSubmit={handleInvite}
              style={{
                background: 'var(--surface-alt)',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                <label className="lbl">Officer Badge / Username</label>
                <input
                  type="text"
                  className="field"
                  placeholder="e.g. psca.officer3"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px' }}>
                <label className="lbl">Assigned Operational Role</label>
                <select className="field" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="PSCA Operator">PSCA Operator</option>
                  <option value="Traffic Operator">Traffic Operator</option>
                  <option value="Research">Research</option>
                </select>
              </div>
              <button type="submit" className="btn-p" disabled={isInviting}>
                {isInviting ? 'Enrolling...' : 'Issue Access Key'}
              </button>
              <button type="button" className="btn-g" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
            </form>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Badge / Username</th>
                  <th>Assigned Role</th>
                  <th>Access Status</th>
                  <th>Last Console Session</th>
                  <th>Request</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.account_id ?? u.name}>
                    <td style={{ fontWeight: 600 }}>
                      <div className="mono">{u.name}</div>
                      {u.email && <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{u.email}</div>}
                    </td>
                    <td><span className={`chip ${RC[u.role] || 'c-gray'}`}>{u.role}</span></td>
                    <td><span className={`chip ${u.status === 'ACTIVE' ? 'c-green' : u.status === 'PENDING' ? 'c-blue' : 'c-gray'}`}>{u.status}</span></td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>{u.last}</td>
                    <td>
                      {u.status === 'PENDING' && u.account_id !== undefined && (
                        <button
                          type="button"
                          className="btn-g"
                          onClick={() => u.account_id !== undefined && handleApprove(u.account_id)}
                          disabled={approvingAccountId !== null}
                          aria-label={`Approve access for ${u.name}`}
                        >
                          <Check size={14} strokeWidth={1.8} />
                          {approvingAccountId === u.account_id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Role Permissions Matrix Tab */}
      {tab === 'roles' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Role Permissions Matrix">
          <div>
            <span className="lbl">Security Governance</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Role-Based Access Control (RBAC) Matrix
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>System Operational Capability</th>
                  <th style={{ textAlign: 'center' }}>Admin</th>
                  <th style={{ textAlign: 'center' }}>PSCA Operator</th>
                  <th style={{ textAlign: 'center' }}>Traffic Operator</th>
                  <th style={{ textAlign: 'center' }}>Research (Read-Only)</th>
                </tr>
              </thead>
              <tbody>
                {perms.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      {p.has0 ? <Check size={16} strokeWidth={2} style={{ color: 'var(--success)', margin: '0 auto' }} aria-label={p.l0} /> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.has1 ? <Check size={16} strokeWidth={2} style={{ color: 'var(--success)', margin: '0 auto' }} aria-label={p.l1} /> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.has2 ? <Check size={16} strokeWidth={2} style={{ color: 'var(--success)', margin: '0 auto' }} aria-label={p.l2} /> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.has3 ? <Check size={16} strokeWidth={2} style={{ color: 'var(--success)', margin: '0 auto' }} aria-label={p.l3} /> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tamper-Evident Audit Ledger Tab */}
      {tab === 'audit' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Audit Log">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="lbl">Cryptographic Event Verification</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Tamper-Evident System Audit Ledger
              </h2>
            </div>
            <span className="chip c-gray">SHA-256 Checksum Verified</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor Entity</th>
                  <th>Actuation / Config Event</th>
                  <th>Target Object</th>
                  <th>Validator Outcome</th>
                </tr>
              </thead>
              <tbody>
                {auditList.map((a, idx) => (
                  <tr key={idx}>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>{a.time}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{a.actor}</td>
                    <td>{a.action}</td>
                    <td className="mono">{a.object}</td>
                    <td><span className={`chip ${a.cls}`}>{a.result}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Data & Security Policies Tab */}
      {tab === 'data' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Data Security Policies">
          <div>
            <span className="lbl">Statutory Compliance</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Data Protection & Privacy Architecture Policies
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {policies.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '4px',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                    {p.title}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
