export type TriagePriority = 'P1_CRITICAL' | 'P2_URGENT' | 'P3_STABLE';
export type IntersectionStatus = 'NORMAL' | 'PREPARING' | 'GREEN_HOLD' | 'RESERVED' | 'RESTORED' | 'MANUAL_OVERRIDE';
export type SystemMode = 'MODE_1_PSCA_REAL' | 'MODE_2_DIGITAL_TWIN';
export type UserRole = 'ADMIN' | 'PSCA_OPERATOR' | 'TRAFFIC_OPERATOR' | 'RESEARCH_READONLY';

export interface Hospital {
  id: string;
  name: string;
  category: string;
  location: string;
  lat: number;
  lng: number;
  distance_km: number;
  travel_time_min: number;
  icu_beds_free: number;
  trauma_center_ready: boolean;
  cardiac_cath_lab: boolean;
  traffic_congestion_score: number;
  recommendation_score: number;
  specialties: string[];
}

export interface Intersection {
  id: string;
  code: string;
  name: string;
  corridor_order: number;
  lat: number;
  lng: number;
  distance_from_origin_m: number;
  current_phase: string;
  time_remaining_sec: number;
  cross_traffic_wait_sec: number;
  queue_length_m: number;
  status: IntersectionStatus;
  safety_verified: boolean;
  speed_limit_kmh: number;
  phases: string[];
}

export interface Ambulance {
  id: string;
  callsign: string;
  driver: string;
  paramedic: string;
  current_lat: number;
  current_lng: number;
  speed_kmh: number;
  heading_deg: number;
  distance_traveled_m: number;
  distance_total_m: number;
  eta_seconds: number;
  next_intersection_code: string;
  next_intersection_name: string;
  distance_to_next_m: number;
  time_saved_vs_baseline_min: number;
}

export interface Emergency {
  call_id: string;
  triage_priority: TriagePriority;
  patient_condition: string;
  incident_location: string;
  assigned_ambulance: string;
  target_hospital: string;
  target_hospital_id: string;
  route_strategy: string;
  status: string;
  dispatched_at: string;
  current_corridor_step: number;
  total_corridor_steps: number;
  ambulance: Ambulance;
}

export interface Camera {
  id: string;
  name: string;
  intersection_id: string;
  location: string;
  fps: number;
  resolution: string;
  detected_vehicles: number;
  breakdown: {
    cars: number;
    motorcycles: number;
    rickshaws: number;
    buses: number;
    ambulances: number;
  };
  average_speed_kmh: number;
  queue_length_m: number;
  congestion_level: string;
  density_veh_km: number;
  stream_status: string;
  model_version: string;
}

export interface SafetyLog {
  id: string;
  timestamp: string;
  intersection_id: string;
  intersection_name: string;
  command_type: string;
  rule_evaluated: string;
  parameters: Record<string, any>;
  status: 'APPROVED' | 'REJECTED' | 'REJECTED_ALTERED';
  details: string;
}

export interface StrategyBenchmark {
  id: string;
  name: string;
  type: string;
  ambulance_travel_time_min: number;
  ambulance_wait_time_sec: number;
  stops_count: number;
  normal_traffic_delay_sec: number;
  max_queue_length_m: number;
  corridor_recovery_time_sec: number;
  throughput_veh_hr: number;
}

export interface RouteOption {
  id: string;
  name: string;
  distance_km: number;
  predicted_time_min: number;
  intersections_count: number;
  high_congestion_zones: number;
  estimated_stops: number;
  risk_factor: string;
  path_description: string;
}
