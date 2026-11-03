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

export interface CreatedEmergency {
  id: string;
  type: string;
  priority: string;
  ambulance: string;
  destination: string;
  caller_location: string;
  status: string;
  notes?: string;
  time_str: string;
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
  account_id?: number;
  email?: string;
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

export interface AuthUser {
  full_name: string;
  official_email: string;
  job_title: string;
  role: 'employee' | 'admin';
  department: 'PSCA' | '1122';
}

export interface OTPChallenge {
  status: string;
  challenge_id: string;
  expires_in_seconds: number;
  message: string;
}

export interface AuthResponse {
  status: 'success';
  access_token: string;
  user: AuthUser;
}

export interface SignupPendingResponse {
  status: 'pending_approval';
  message: string;
}

let authToken: string | null = null;

function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  return fetch(input, { ...init, headers });
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const error = await res.json();
    return error.detail || fallback;
  } catch {
    return fallback;
  }
}

export const apiService = {
  setAuthToken(token: string | null) {
    authToken = token;
  },

  async requestSignupOtp(data: {
    full_name: string;
    email: string;
    job_title: string;
    password: string;
    role: 'employee' | 'admin';
    department: 'PSCA' | '1122';
  }): Promise<OTPChallenge> {
    const res = await apiFetch(`${API_BASE}/auth/signup/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not send verification code (${res.status})`));
    return await res.json();
  },

  async verifySignupOtp(email: string, challengeId: string, otp: string): Promise<AuthResponse | SignupPendingResponse> {
    const res = await apiFetch(`${API_BASE}/auth/signup/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, challenge_id: challengeId, otp }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not verify code (${res.status})`));
    return await res.json();
  },

  async login(email: string, password: string, role: 'employee' | 'admin', department: 'PSCA' | '1122'): Promise<AuthResponse> {
    const res = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, department }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not sign in (${res.status})`));
    return await res.json();
  },

  async requestPasswordReset(email: string): Promise<OTPChallenge> {
    const res = await apiFetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not request a reset code (${res.status})`));
    return await res.json();
  },

  async verifyResetOtp(email: string, challengeId: string, otp: string): Promise<{ status: string; reset_token: string }> {
    const res = await apiFetch(`${API_BASE}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, challenge_id: challengeId, otp }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not verify code (${res.status})`));
    return await res.json();
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<{ status: string; message: string }> {
    const res = await apiFetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not reset password (${res.status})`));
    return await res.json();
  },

  async getHealth() {
    try {
      const res = await apiFetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'healthy', mode: 'Mode 2 · Digital Twin (SUMO TraCI)' };
    }
  },

  async getDashboard() {
    try {
      const res = await apiFetch(`${API_BASE}/dashboard`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async toggleIncident() {
    try {
      const res = await apiFetch(`${API_BASE}/dashboard/incident`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getEmergencies(): Promise<{ emergencies: EmergencyRecord[] } | null> {
    const res = await apiFetch(`${API_BASE}/emergencies`);
    if (!res.ok) throw new Error(`Could not load emergencies (${res.status})`);
    return await res.json();
  },

  async createEmergency(data: { location: string; type: string; priority: string; ambulance: string; destination?: string; notes?: string }): Promise<{ status: string; emergency: CreatedEmergency }> {
    const res = await apiFetch(`${API_BASE}/emergencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Could not create emergency (${res.status})`);
    return await res.json();
  },

  async getRouting(emergencyType?: string): Promise<{ hospitals: HospitalRoute[]; incident_active: boolean }> {
    const query = emergencyType ? `?emergency_type=${encodeURIComponent(emergencyType)}` : '';
    const res = await apiFetch(`${API_BASE}/routing${query}`);
    if (!res.ok) throw new Error(`Could not load hospital route predictions (${res.status})`);
    return await res.json();
  },

  async scrubCorridor(t: number, lead: number, hold: number) {
    try {
      const res = await apiFetch(`${API_BASE}/corridor/scrub`, {
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
      const res = await apiFetch(`${API_BASE}/perception/cameras`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCameraDetections(cameraId: string): Promise<{ camera_id: string; detections: DetectionBox[] } | null> {
    try {
      const res = await apiFetch(`${API_BASE}/perception/detections/${cameraId}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getPredictionForecast(segmentId: string = 'SEG-I2-I3'): Promise<{ segment_id: string; points: ForecastPoint[]; metrics: any } | null> {
    try {
      const res = await apiFetch(`${API_BASE}/prediction/forecast?segment_id=${segmentId}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getSafety(): Promise<SafetyState | null> {
    try {
      const res = await apiFetch(`${API_BASE}/safety`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async authorizeCommand(id: string) {
    try {
      const res = await apiFetch(`${API_BASE}/safety/authorize/${id}`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  async rejectCommand(id: string) {
    try {
      const res = await apiFetch(`${API_BASE}/safety/reject/${id}`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getTwinBenchmarks(scenario: string = 'peak') {
    try {
      const res = await apiFetch(`${API_BASE}/twin/benchmarks?scenario=${scenario}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async runSimulation(scenario: string, strategy: string): Promise<SimulationResult | null> {
    try {
      const res = await apiFetch(`${API_BASE}/twin/simulate`, {
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
      const res = await apiFetch(`${API_BASE}/evaluation/rq`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getUsers(): Promise<{ users: UserRecord[] }> {
    const res = await apiFetch(`${API_BASE}/admin/users`);
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not load users (${res.status})`));
    return await res.json();
  },

  async approveUser(accountId: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/admin/users/${accountId}/approve`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, `Could not approve account (${res.status})`));
  },

  async inviteUser(username: string, role: string) {
    try {
      const res = await apiFetch(`${API_BASE}/admin/users/invite`, {
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
