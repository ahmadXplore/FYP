import React from 'react';
import { AlertTriangle, ArrowRight, Clock3, MapPin, PhoneCall } from 'lucide-react';

export interface Incoming1122Request {
  id: string;
  receivedAt: string;
  caller: string;
  location: string;
  type: string;
  priority: string;
  ambulance: string;
  notes: string;
}

interface EmergenciesViewProps {
  completedRequestIds: string[];
  onSelectRequest: (request: Incoming1122Request) => void;
}

const demoRequests: Incoming1122Request[] = [
  {
    id: '1122-CALL-0471',
    receivedAt: 'Just now',
    caller: 'Rescue 1122 Dispatch',
    location: 'Model Town Link Road, Lahore',
    type: 'Cardiac arrest',
    priority: 'P1',
    ambulance: 'AMB-017',
    notes: 'Patient reported unconscious. Cardiac response team dispatched.',
  },
  {
    id: '1122-CALL-0470',
    receivedAt: '2 min ago',
    caller: 'Rescue 1122 Dispatch',
    location: 'Ferozepur Road near Kalma Chowk',
    type: 'Major trauma',
    priority: 'P1',
    ambulance: 'AMB-022',
    notes: 'Road traffic collision. Ambulance en route to pickup location.',
  },
  {
    id: '1122-CALL-0469',
    receivedAt: '5 min ago',
    caller: 'Rescue 1122 Dispatch',
    location: 'Canal Bank Road, Lahore',
    type: 'Stroke',
    priority: 'P2',
    ambulance: 'AMB-009',
    notes: 'Suspected acute stroke. Dispatch requested hospital route assessment.',
  },
];

export const EmergenciesView: React.FC<EmergenciesViewProps> = ({
  completedRequestIds,
  onSelectRequest,
}) => {
  const requests = demoRequests.filter((request) => !completedRequestIds.includes(request.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 32px' }}>
      <section
        className="card"
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span className="lbl">1122 Dispatch Queue</span>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Incoming emergency requests</h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Select a dispatch request to review its details, compare hospital routes, and authorize corridor creation.
          </span>
        </div>
        <span className="chip c-amber">
          <AlertTriangle size={13} aria-hidden="true" />
          DEMO REQUEST FEED
        </span>
      </section>

      <div role="status" style={{ padding: '12px 16px', background: 'var(--navy-50)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--primary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        These sample requests demonstrate the operator workflow. A live Rescue 1122 dispatch integration is not connected yet.
      </div>

      {requests.length === 0 ? (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '40px 20px', textAlign: 'center' }}>
          <PhoneCall size={24} color="var(--text-secondary)" aria-hidden="true" />
          <h2 style={{ margin: 0, fontSize: '18px' }}>No requests awaiting review</h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>New 1122 requests will appear here.</span>
        </section>
      ) : (
        <section aria-label="Incoming 1122 emergency requests" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
          {requests.map((request) => (
            <article key={request.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{request.id}</span>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{request.type}</h3>
                </div>
                <span className={`chip ${request.priority === 'P1' ? 'c-red' : 'c-amber'}`}>{request.priority} PRIORITY</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={16} aria-hidden="true" />
                  <span>{request.location}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <PhoneCall size={15} aria-hidden="true" /> {request.ambulance}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Clock3 size={15} aria-hidden="true" /> {request.receivedAt}
                  </span>
                </div>
                <span>{request.notes}</span>
              </div>

              <button type="button" className="btn-p" onClick={() => onSelectRequest(request)}>
                Review request <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};
