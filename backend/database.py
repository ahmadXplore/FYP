"""
Database Layer for GreenCorridor AI Backend
Uses SQLite for persistent, reliable, zero-configuration local storage.
Pre-seeds realistic data matching the FYP Proposal and Lahore PSCA / UMT corridor.
"""

import sqlite3
import os
from datetime import datetime
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "greencorridor.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()

    # 1. Emergencies Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS emergencies (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        ambulance TEXT NOT NULL,
        destination TEXT NOT NULL,
        caller_location TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        time_str TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Cameras Table (Perception module)
    c.execute("""
    CREATE TABLE IF NOT EXISTS cameras (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        junction_id TEXT NOT NULL,
        approach TEXT NOT NULL,
        vehicle_count INTEGER NOT NULL,
        avg_speed_kmh REAL NOT NULL,
        density_pct INTEGER NOT NULL,
        queue_meters INTEGER NOT NULL,
        congestion_level TEXT NOT NULL,
        homography_status TEXT NOT NULL,
        fps REAL NOT NULL
    )
    """)

    # 3. Detections Table (YOLOv8 Mock Output)
    c.execute("""
    CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        class_name TEXT NOT NULL,
        confidence REAL NOT NULL,
        bbox_x INTEGER NOT NULL,
        bbox_y INTEGER NOT NULL,
        bbox_w INTEGER NOT NULL,
        bbox_h INTEGER NOT NULL,
        FOREIGN KEY(camera_id) REFERENCES cameras(id)
    )
    """)

    # 4. Traffic Forecasts Table (Prediction module)
    c.execute("""
    CREATE TABLE IF NOT EXISTS traffic_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        segment_id TEXT NOT NULL,
        time_offset_min INTEGER NOT NULL,
        stgcn_speed REAL NOT NULL,
        lstm_speed REAL NOT NULL,
        baseline_speed REAL NOT NULL,
        upper_bound REAL NOT NULL,
        lower_bound REAL NOT NULL
    )
    """)

    # 5. Safety Authorizations Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS safety_authorizations (
        id TEXT PRIMARY KEY,
        junction_id TEXT NOT NULL,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        cross_delay_impact_sec INTEGER NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        proposed_by TEXT NOT NULL,
        proposed_at TEXT NOT NULL,
        decided_by TEXT,
        decided_at TEXT
    )
    """)

    # 6. Audit Logs Table (Tamper-evident hash chain)
    c.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time_str TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        target_object TEXT NOT NULL,
        result TEXT NOT NULL,
        status_class TEXT NOT NULL,
        hash_signature TEXT NOT NULL
    )
    """)

    # 7. Users Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        last_active TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 8. Simulation Runs Table (Digital Twin)
    c.execute("""
    CREATE TABLE IF NOT EXISTS simulation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario TEXT NOT NULL,
        strategy TEXT NOT NULL,
        travel_time_sec INTEGER NOT NULL,
        stops INTEGER NOT NULL,
        delay_pct REAL NOT NULL,
        fuel_saved_liters REAL NOT NULL,
        co2_saved_kg REAL NOT NULL,
        run_timestamp TEXT NOT NULL
    )
    """)

    conn.commit()

    # Pre-seed default data if empty
    c.execute("SELECT COUNT(*) FROM emergencies")
    if c.fetchone()[0] == 0:
        seed_data(conn)

    conn.close()

def compute_hash(prev_hash: str, text: str) -> str:
    return hashlib.sha256(f"{prev_hash}:{text}".encode("utf-8")).hexdigest()[:16]

def seed_data(conn: sqlite3.Connection):
    c = conn.cursor()

    # Emergencies
    emergencies = [
        ("EM-0412", "Cardiac arrest", "P1", "AMB-017", "Jinnah Hospital", "Model Town Link Rd", "ACTIVE", "Patient on monitor, STEMI alert. Green corridor assigned.", "16:09"),
        ("EM-0411", "Major trauma", "P2", "AMB-022", "Mayo Hospital", "Ferozepur Rd", "COMPLETED", "Multiple vehicle collision patient safely transferred.", "15:31"),
        ("EM-0410", "Stroke", "P1", "AMB-009", "Services Hospital", "Canal Bank Rd", "COMPLETED", "Acute ischemic stroke thrombolytic protocol executed.", "14:48")
    ]
    c.executemany("""
    INSERT INTO emergencies (id, type, priority, ambulance, destination, caller_location, status, notes, time_str)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, emergencies)

    # Cameras
    cameras = [
        ("CAM-I1-S", "Junction I1 (Kalma Chowk), south approach", "I1", "South", 14, 34.2, 38, 22, "Moderate", "calibrated", 29.8),
        ("CAM-I2-S", "Junction I2 (Garden Town), south approach", "I2", "South", 23, 21.5, 61, 48, "Heavy", "calibrated", 30.0),
        ("CAM-I3-W", "Junction I3 (Canal Underpass), west approach", "I3", "West", 9, 41.0, 24, 10, "Light", "calibrated", 29.9),
        ("CAM-I4-S", "Junction I4 (Shama Ichhra), south approach", "I4", "South", 17, 28.7, 44, 31, "Moderate", "calibrated", 30.1)
    ]
    c.executemany("""
    INSERT INTO cameras (id, name, junction_id, approach, vehicle_count, avg_speed_kmh, density_pct, queue_meters, congestion_level, homography_status, fps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, cameras)

    # Detections for CAM-I2-S (as shown in Perception view)
    detections = [
        ("CAM-I2-S", "car_41", "car", 0.94, 300, 330, 86, 56),
        ("CAM-I2-S", "car_44", "car", 0.91, 420, 360, 90, 62),
        ("CAM-I2-S", "bus_17", "bus", 0.96, 355, 262, 62, 44),
        ("CAM-I2-S", "moto_52", "motorcycle", 0.88, 440, 276, 34, 30),
        ("CAM-I2-S", "rickshaw_38", "rickshaw", 0.89, 318, 282, 30, 26),
        ("CAM-I2-S", "truck_29", "truck", 0.92, 372, 170, 46, 34),
        ("CAM-I2-S", "amb_017", "ambulance", 0.99, 388, 112, 30, 24)
    ]
    c.executemany("""
    INSERT INTO detections (camera_id, track_id, class_name, confidence, bbox_x, bbox_y, bbox_w, bbox_h)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, detections)

    # Forecasts for segment I2 -> I3
    forecasts = [
        ("SEG-I2-I3", 5, 33.2, 31.8, 30.0, 36.5, 30.1),
        ("SEG-I2-I3", 10, 35.8, 34.0, 29.5, 39.2, 32.4),
        ("SEG-I2-I3", 15, 38.4, 36.5, 28.9, 42.0, 34.8),
        ("SEG-I2-I3", 20, 41.1, 38.9, 28.0, 44.5, 37.6),
        ("SEG-I2-I3", 25, 42.6, 40.2, 27.5, 46.1, 39.0),
        ("SEG-I2-I3", 30, 43.5, 41.0, 27.0, 47.0, 40.1)
    ]
    c.executemany("""
    INSERT INTO traffic_forecasts (segment_id, time_offset_min, stgcn_speed, lstm_speed, baseline_speed, upper_bound, lower_bound)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, forecasts)

    # Safety Authorizations
    auths = [
        ("a1", "I3", "I3: prepare and hold green for AMB-017", "Proposed by corridor engine for T+04:44. Estimated cross-traffic delay +9 s, within limit.", 9, "medium", "pending", "corridor-engine", "16:11:40", None, None),
        ("a2", "I4", "I4: reserve green slot", "Proposed for T+06:29. Estimated cross-traffic delay +6 s, within limit.", 6, "low", "pending", "corridor-engine", "16:12:02", None, None)
    ]
    c.executemany("""
    INSERT INTO safety_authorizations (id, junction_id, title, detail, cross_delay_impact_sec, severity, status, proposed_by, proposed_at, decided_by, decided_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, auths)

    # Audit Logs
    audit = [
        ("16:12:48", "corridor-engine", "Proposed green priority", "I1", "APPROVED", "c-green"),
        ("16:12:31", "ppo-controller", "Proposed extend green +22 s", "I1", "REJECTED", "c-red"),
        ("16:11:40", "psca.operator1", "Viewed command awaiting authorisation", "I3", "LOGGED", "c-gray"),
        ("16:09:05", "psca.operator1", "Created emergency request", "EM-0412", "CREATED", "c-blue"),
        ("16:08:52", "demo.admin", "Changed prepare lead time to 40 s", "Corridor settings", "SAVED", "c-blue"),
        ("15:31:10", "system", "Restored normal plan", "I4", "APPROVED", "c-green"),
        ("15:02:44", "demo.admin", "Signed in", "Console", "OK", "c-gray")
    ]
    prev = "GENESIS_HASH"
    for row in audit:
        h = compute_hash(prev, f"{row[0]}:{row[1]}:{row[2]}:{row[3]}")
        prev = h
        c.execute("""
        INSERT INTO audit_logs (time_str, actor, action, target_object, result, status_class, hash_signature)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (row[0], row[1], row[2], row[3], row[4], row[5], h))

    # Users
    users = [
        ("demo.admin", "Admin", "ACTIVE", "Today 16:02"),
        ("psca.operator1", "PSCA Operator", "ACTIVE", "Today 16:12"),
        ("traffic.operator1", "Traffic Operator", "ACTIVE", "Today 15:40"),
        ("research.viewer", "Research", "INVITED", "Never")
    ]
    c.executemany("""
    INSERT INTO users (username, role, status, last_active)
    VALUES (?, ?, ?, ?)
    """, users)

    # Initial simulations (Benchmarks)
    runs = [
        ("peak", "A", 600, 6, 0.0, 0.0, 0.0, "2026-10-24 14:00"),
        ("peak", "B", 540, 4, 9.0, 0.2, 0.5, "2026-10-24 14:10"),
        ("peak", "C", 504, 5, 2.0, 0.3, 0.8, "2026-10-24 14:20"),
        ("peak", "D", 444, 2, 7.0, 0.6, 1.4, "2026-10-24 14:30"),
        ("peak", "E", 402, 1, 5.0, 0.8, 1.9, "2026-10-24 14:40"),
        ("peak", "F", 378, 1, 4.0, 0.9, 2.2, "2026-10-24 14:50")
    ]
    c.executemany("""
    INSERT INTO simulation_runs (scenario, strategy, travel_time_sec, stops, delay_pct, fuel_saved_liters, co2_saved_kg, run_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, runs)

    conn.commit()
