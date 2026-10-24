"""
Corridor Engine for GreenCorridor AI
Calculates dynamic green wave progression, junction arrival times (ETA),
phase hold requirements, and time-space diagram progression states.
"""

from typing import List, Dict, Any

class CorridorEngine:
    def __init__(self):
        # 4 Corridor Intersections
        # Total travel time along corridor baseline is ~420 seconds (7 minutes)
        self.junctions = [
            {"id": "I1", "name": "Kalma Chowk", "arrival_sec": 62, "distance_m": 850},
            {"id": "I2", "name": "Garden Town", "arrival_sec": 175, "distance_m": 2100},
            {"id": "I3", "name": "Canal Underpass", "arrival_sec": 284, "distance_m": 3450},
            {"id": "I4", "name": "Shama Ichhra", "arrival_sec": 389, "distance_m": 4700}
        ]
        self.total_seconds = 420

    def compute_scrub(self, t_current: int, lead_sec: int = 40, hold_sec: int = 10) -> Dict[str, Any]:
        """
        Determines the state of each junction along the corridor given time offset t_current (0..420s).
        States:
        - MONITOR: Ambulance is far away, regular coordinated plan active
        - PREPARING: Within lead_sec window, queue clearance and green extension engaged
        - GREEN PRIORITY HOLD: Ambulance arrives, priority green held
        - RESTORING: Post-clearance transition back to local cyclic plan
        - RESTORED: Return to nominal baseline
        """
        results = []
        for j in self.junctions:
            a = j["arrival_sec"]
            prep_start = a - lead_sec
            green_start = a - 15
            green_end = a + hold_sec
            restore_end = green_end + 20

            if t_current < prep_start:
                st = "MONITOR"
                color = "#7F90AB"
                desc = f"Monitoring approach. Priority slot reserved for T+{a:02d}s."
            elif t_current < green_start:
                st = "PREPARING"
                color = "#F6B93B"
                desc = "Shortening opposing cross-street phase; flushing queued vehicles."
            elif t_current < green_end:
                st = "GREEN PRIORITY HOLD"
                color = "#34D3A8"
                desc = "Priority green phase locked until ambulance clears inductive/camera detector."
            elif t_current < restore_end:
                st = "RESTORING"
                color = "#6AAEFF"
                desc = "Gradual offset compensation returning signal to master cycle."
            else:
                st = "RESTORED"
                color = "#6AAEFF"
                desc = "Ambulance passed. Local adaptive coordination restored."

            results.append({
                "id": j["id"],
                "name": j["name"],
                "arrival_sec": a,
                "stage": st,
                "color": color,
                "description": desc,
                "eta_sec": max(0, a - t_current)
            })

        return {
            "current_time_sec": t_current,
            "lead_time_sec": lead_sec,
            "hold_time_sec": hold_sec,
            "junction_states": results
        }

corridor_engine = CorridorEngine()
