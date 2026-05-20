import sys
import os

# Add backend to path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("1. Initializing System")
    resp = client.get("/api/v1/system/init")
    print(resp.status_code, resp.json())
    assert resp.status_code == 200

    print("\n2. Checking Zones")
    resp = client.get("/api/v1/zones/status")
    print(resp.status_code, resp.json())
    assert resp.status_code == 200
    assert len(resp.json()) == 12
    
    print("\n3. Testing Agent 1 Standalone (Flood)")
    payload = {
      "complaint_text": "Barish ki wajah se paani jam gaya aur rasta band ho gaya",
      "rainfall_mm": 65.0,
      "aqi": 90.0,
      "visibility_km": 2.0,
      "congestion_ratio": 0.85,
      "avg_speed_kmh": 10.0,
      "zone_hint": "Z03"
    }
    resp = client.post("/api/v1/crisis/detect", json=payload)
    print(resp.status_code, resp.json())
    assert resp.status_code == 200
    
    print("\n4. Submitting Workflow")
    workflow_payload = {
      "complaint_text": "Gulberg mein paani aa gaya, sarak band ho gayi, bahut barish ho rahi hai",
      "zone_hint": "Z01",
      "weather": {
          "rainfall_mm": 75.0,
          "aqi": 120.0,
          "visibility_km": 1.5,
          "temperature_c": 28.0,
          "humidity_percent": 95.0
      },
      "traffic": {
          "congestion_ratio": 0.88,
          "avg_speed_kmh": 8.0,
          "incident_reported": True,
          "affected_road": "Main Boulevard"
      },
      "source": "social_media"
    }
    resp = client.post("/api/v1/workflow/run", json=workflow_payload)
    print(resp.status_code, resp.json())
    assert resp.status_code == 202
    
    workflow_id = resp.json()["workflow_id"]
    
    import time
    time.sleep(1) # wait for background task
    
    print("\n5. Checking Workflow Result")
    resp = client.get(f"/api/v1/workflow/result/{workflow_id}")
    print(resp.status_code)
    try:
        import json
        print(json.dumps(resp.json(), indent=2).encode('ascii', 'ignore').decode('ascii'))
    except Exception:
        pass
    assert resp.status_code == 200
    
    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    run_tests()
