from django.core.management.base import BaseCommand
import asyncio
import websockets
import os


# Test sending data
"""
curl -d "{\"data\": [{\"device_serial\": \"Fitbit12334\", \"timestamp\": 1656356068080, \"dataType\": \"HR\", \"dataValues\": [65.0]}]}" -H "Content-Type: application/json" -X POST https://localhost:8000/data/add_data
"""
async def client(uri):
    async for websocket in websockets.connect(uri):
        print("Connected to websocket server")
        try:
            async for message in websocket:
                print(message)
        except websockets.ConnectionClosed:
            print("Connection Lost! Retrying...")
            continue

class Command(BaseCommand):

    def handle(self, *args, **options):
        URL = f"wss://{os.environ.get('REHM_CLOUD_HOST')}/ws/data"
        print(f"Connecting to websocket server {URL}")
        asyncio.run(client(URL))