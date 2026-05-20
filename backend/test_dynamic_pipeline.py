from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def run_tests():
    print("Testing dynamic pipeline...")
    
    # 1. Ingest signal (Flood)
    payload = {
        "signal": "Liberty Chowk pe pani bhar gaya, underpass blocked",
        "floodRisk": True,
        "smokeDetected": False,
        "powerOutage": False
    }
    
    print("\n[POST] /signals/ingest")
    resp = client.post("/signals/ingest", json=payload)
    print(resp.status_code, resp.json())
    assert resp.status_code == 200
    
    # 2. Get Crisis Current
    print("\n[GET] /crisis/current")
    resp = client.get("/crisis/current")
    print(resp.status_code, resp.json())
    assert resp.status_code == 200
    
    # 3. Get Traces
    print("\n[GET] /agents/traces")
    resp = client.get("/agents/traces")
    print(resp.status_code)
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 200
    
    # 4. Get Simulation Status
    print("\n[GET] /simulation/status")
    resp = client.get("/simulation/status")
    print(resp.status_code)
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 200
    
    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    run_tests()
