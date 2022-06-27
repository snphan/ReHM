from django.core.management.base import BaseCommand
import asyncio
import websockets
import os


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