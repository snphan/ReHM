from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket

from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the BROKER_cloud app, we ingest data!"}

def test_websocket():
    with client.websocket_connect("/ws/data") as websocket:
        data = websocket.receive_json()
        assert data == {"msg": "Connected"}