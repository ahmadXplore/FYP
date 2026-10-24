const API_BASE = '/api';

export interface EmergencyRecord {
  id: string;
  type: string;
  priority: string;
  pc: string;
  amb: string;
  dest: string;
  status: string;
  sc: string;
  time: string;
  location: string;
  notes?: string;
}

export interface HospitalRoute {
  id: string;
  name: string;
  dist: number;
  tags: string;
  cap: string;
  cap_cls: string;
  travel_time_sec: number;
  cong_penalty_sec: number;
  signal_delay_sec: number;
  short_dist_sec: number;
  total_sec: number;
  rank: number;
  insight: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  junction_id: string;
  approach: string;
  vehicle_count: number;
  avg_speed_kmh: number;
  density_pct: number;
  queue_meters: number;
  congestion_level: string;
  homography_status: string;
  fps: number;
}

export interface DetectionBox {
  id: number;
  camera_id: string;
  track_id: string;
  class_name: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

export interface ForecastPoint {
  id: number;
  segment_id: string;
  time_offset_min: number;
  stgcn_speed: number;
  lstm_speed: number;
  baseline_speed: number;
  upper_bound: number;
  lower_bound: number;
}

export interface SafetyState {
  totals: {
    all: number;
    approved: number;
    rejected: number;
    awaiting: number;
  };
  queue: Array<{
    id: string;
    junction_id: string;
    title: string;
    detail: string;
    cross_delay_impact_sec: number;
    severity: string;
    status: string;
    proposed_by: string;
    proposed_at: string;
    decided_by?: string;
    decided_at?: string;
  }>;
  audit: Array<{
    time: string;
    actor: string;
    action: string;
    object: string;
    result: string;
    cls: string;
  }>;
}

export interface UserRecord {
  name: string;
  role: string;
  status: string;
  last: string;
}

export interface SimulationResult {
  scenario: string;
  strategy: string;
  time_str: string;
  stops: number;
  delay_percent: number;
  seeds_run: number;
  time_saved_pct?: number;
  p_value?: string;
}

export const apiService = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'healthy', mode: 'Mode 2 · Digital Twin (SUMO TraCI)' };
    }
  },

  async getDashboard() {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async toggleIncident() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/incident`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getEmergencies(): Promise<{ emergencies: EmergencyRecord[] } | null> {
    try {
      const res = await fetch(`${API_BASE}/emergencies`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async createEmergency(data: { location: string; type: string; priority: string; ambulance: string; destination?: string; notes?: string }) {
    try {
      const res = await fetch(`${API_BASE}/emergencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getRouting(): Promise<{ hospitals: HospitalRoute[]; incident_active: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE}/routing`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async scrubCorridor(t: number, lead: number, hold: number) {
    try {
      const res = await fetch(`${API_BASE}/corridor/scrub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t, lead, hold }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getPerceptionCameras(): Promise<{ cameras: CameraFeed[] } | null> {
    try {
      const res = await fetch(`${API_BASE}/perception/cameras`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCameraDetections(cameraId: string): Promise<{ camera_id: string; detections: DetectionBox[] } | null> {
    try {
      const res = await fetch(`${API_BASE}/perception/detections/${cameraId}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getPredictionForecast(segmentId: string = 'SEG-I2-I3'): Promise<{ segment_id: string; points: ForecastPoint[]; metrics: any } | null> {
    try {
      const res = await fetch(`${API_BASE}/prediction/forecast?segment_id=${segmentId}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getSafety(): Promise<SafetyState | null> {
    try {
      const res = await fetch(`${API_BASE}/safety`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async authorizeCommand(id: string) {
    try {
      const res = await fetch(`${API_BASE}/safety/authorize/${id}`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  async rejectCommand(id: string) {
    try {
      const res = await fetch(`${API_BASE}/safety/reject/${id}`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getTwinBenchmarks(scenario: string = 'peak') {
    try {
      const res = await fetch(`${API_BASE}/twin/benchmarks?scenario=${scenario}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async runSimulation(scenario: string, strategy: string): Promise<SimulationResult | null> {
    try {
      const res = await fetch(`${API_BASE}/twin/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, strategy }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getEvaluationRQ() {
    try {
      const res = await fetch(`${API_BASE}/evaluation/rq`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getUsers(): Promise<{ users: UserRecord[] } | null> {
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async inviteUser(username: string, role: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
};
