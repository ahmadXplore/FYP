import React, { useState, useEffect } from 'react';
import { apiService, UserRecord } from '../services/api';

export const AdminView: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'roles' | 'audit' | 'data'>('users');
  const [usersList, setUsersList] = useState<UserRecord[]>([
    { name: 'demo.admin', role: 'Admin', status: 'ACTIVE', last: 'Today 16:02' },
    { name: 'psca.operator1', role: 'PSCA Operator', status: 'ACTIVE', last: 'Today 16:12' },
    { name: 'traffic.operator1', role: 'Traffic Operator', status: 'ACTIVE', last: 'Today 15:40' },
    { name: 'research.viewer', role: 'Research', status: 'INVITED', last: 'Never' },
  ]);
  const [auditList, setAuditList] = useState<Array<{ time: string; actor: string; action: string; object: string; result: string; cls: string }>>([
    { time: '16:12:48', actor: 'corridor-engine', action: 'Proposed green priority', object: 'I1', result: 'APPROVED', cls: 'c-green' },
    { time: '16:12:31', actor: 'ppo-controller', action: 'Proposed extend green +22 s', object: 'I1', result: 'REJECTED', cls: 'c-red' },
    { time: '16:11:40', actor: 'psca.operator1', action: 'Viewed command awaiting authorisation', object: 'I3', result: 'LOGGED', cls: 'c-gray' },
    { time: '16:09:05', actor: 'psca.operator1', action: 'Created emergency request', object: 'EM-0412', result: 'CREATED', cls: 'c-blue' },
    { time: '16:08:52', actor: 'demo.admin', action: 'Changed prepare lead time to 40 s', object: 'Corridor settings', result: 'SAVED', cls: 'c-blue' },
    { time: '15:31:10', actor: 'system', action: 'Restored normal plan', object: 'I4', result: 'APPROVED', cls: 'c-green' },
    { time: '15:02:44', actor: 'demo.admin', action: 'Signed in', object: 'Console', result: 'OK', cls: 'c-gray' },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('PSCA Operator');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await apiService.getUsers();
      if (res && res.users) {
        setUsersList(res.users);
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

  const tabs = [
    { id: 'users' as const, label: 'Users' },
    { id: 'roles' as const, label: 'Role permissions' },
    { id: 'audit' as const, label: 'Audit log' },
    { id: 'data' as const, label: 'Data and security' },
  ];

  const RC: Record<string, string> = {
    Admin: 'c-blue',
    'PSCA Operator': 'c-green',
    'Traffic Operator': 'c-amber',
    Research: 'c-gray',
  };

  const perms = [
    ['View dashboard and corridor status', 1, 1, 1, 1],
    ['Create emergency requests', 1, 1, 0, 0],
    ['Authorise live signal actions', 1, 1, 0, 0],
    ['View traffic perception and prediction', 1, 1, 1, 0],
    ['View safety log', 1, 1, 1, 1],
    ['Run simulations and view evaluation', 1, 1, 0, 1],
    ['Manage users and adapters', 1, 0, 0, 0],
    ['Export audit log', 1, 0, 0, 0],
  ].map((r) => {
    const o: Record<string, any> = { name: r[0] };
    for (let i = 0; i < 4; i++) {
      o['s' + i] = r[i + 1] ? '✓' : '–';
      o['c' + i] = r[i + 1] ? '#34D3A8' : '#7F90AB';
      o['l' + i] = r[i + 1] ? 'Allowed' : 'Not allowed';
    }
    return o;
  });

  const policies = [
    { title: 'Processed locally', text: 'Camera frames, internal network details and raw surveillance data are never sent to external services.' },
    { title: 'Anonymous vehicle IDs', text: 'Only location, speed, heading, timestamp and destination are used for an emergency vehicle.' },
    { title: 'Offline-first, on-premise', text: 'Runs on Linux with PostgreSQL + PostGIS and Redis. No public cloud dependency.' },
    { title: 'Role-based access', text: 'Admin, PSCA Operator, Traffic Operator and Research read-only, with JWT sessions and TLS.' },
    { title: 'AI is advisory', text: 'Every command passes the safety validator and, in live use, operator authorisation.' },
    { title: 'Everything is logged', text: 'All decisions, including rejected commands, are kept in the tamper-evident audit log.' },
  ];

  return (
    <main style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tab Switcher */}
      <div role="group" aria-label="Sections" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'tab-on' : ''}`}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Users">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Users</h2>
            <button type="button" className="btn-p" onClick={() => setShowInviteModal(true)}>
              Invite user
            </button>
          </div>

          {showInviteModal && (
            <form onSubmit={handleInvite} style={{ background: '#0B1220', padding: '16px', borderRadius: '10px', border: '1px solid #243350', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
                <label className="lbl">Username / Officer ID</label>
                <input
                  type="text"
                  className="field"
                  placeholder="e.g. psca.officer2"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 180px' }}>
                <label className="lbl">Role</label>
                <select className="field" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="PSCA Operator">PSCA Operator</option>
                  <option value="Traffic Operator">Traffic Operator</option>
                  <option value="Research">Research</option>
                </select>
              </div>
              <button type="submit" className="btn-p" disabled={isInviting}>
                {isInviting ? 'Inviting...' : 'Send invite'}
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
                  <th>Username</th><th>Role</th><th>Status</th><th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.name}>
                    <td className="mono" style={{ fontWeight: 600 }}>{u.name}</td>
                    <td><span className={`chip ${RC[u.role] || 'c-gray'}`}>{u.role}</span></td>
                    <td><span className={`chip ${u.status === 'ACTIVE' ? 'c-green' : 'c-gray'}`}>{u.status}</span></td>
                    <td className="mono" style={{ color: '#A3B2CA' }}>{u.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Role permissions">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Role permissions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Admin</th>
                  <th>PSCA Operator</th>
                  <th>Traffic Operator</th>
                  <th>Research (read-only)</th>
                </tr>
              </thead>
              <tbody>
                {perms.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="mono" style={{ color: p.c0, fontWeight: 700 }} aria-label={p.l0}>{p.s0}</span></td>
                    <td><span className="mono" style={{ color: p.c1, fontWeight: 700 }} aria-label={p.l1}>{p.s1}</span></td>
                    <td><span className="mono" style={{ color: p.c2, fontWeight: 700 }} aria-label={p.l2}>{p.s2}</span></td>
                    <td><span className="mono" style={{ color: p.c3, fontWeight: 700 }} aria-label={p.l3}>{p.s3}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Audit log">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Audit log</h2>
            <span className="chip c-gray">Includes rejected commands & SHA-256 signatures</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Time</th><th>Actor</th><th>Action</th><th>Object</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {auditList.map((a, idx) => (
                  <tr key={idx}>
                    <td className="mono" style={{ color: '#A3B2CA' }}>{a.time}</td>
                    <td className="mono">{a.actor}</td>
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

      {/* Data & Security Tab */}
      {tab === 'data' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Data and security">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Data and security policies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {policies.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: '#0B1220',
                  border: '1px solid #243350',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <span style={{ fontWeight: 700, color: '#34D3A8' }}>{p.title}</span>
                <span style={{ fontSize: '13px', color: '#A3B2CA', lineHeight: 1.45 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
