from django.core.management.base import BaseCommand
import asyncio
import websockets
import os
import accounts.models as accnt_models
import json
from asgiref.sync import sync_to_async
import requests
import sys

async def client(uri, post_host):
    """Function to connect to the Cloud Broker, and process the data to match
    the interface required by the Dashboard application and the Database.

    Args:
        uri (str): URL of the websocket endpoint for cloud broker. Uses then environment
        variable REHM_CLOUD_HOST to construct.
        post_host (str): Host url of where to post the processed data to the dashboard.
    """
    # Database calls are originally synchronous.
    allDevices = await sync_to_async(accnt_models.Device.objects.all)()
    allDevices = await sync_to_async(allDevices.values)()
    allDevices_cache = await sync_to_async(list)(allDevices)
    # TODO: Update the cache when someone registeres a new device.
    async for websocket in websockets.connect(uri):
        print("Connected to websocket server")
        try:
            async for message in websocket:
                parsed_message = json.loads(message)
                if "data" in parsed_message: 
                    data = parsed_message["data"]
                    serial = data[0]["device_serial"]

                    # Remove device_serial per DataPoint Interface
                    for elem in data:
                        del elem["device_serial"]
                    device_info = list(
                        filter(lambda x: x["serial"] == serial, allDevices_cache)
                    )

                    if len(device_info) > 0:
                        user_id = device_info[0]["user_id"]
                        deviceType = device_info[0]["deviceType_id"]

                        # Add the deviceType as per DataPoint interface
                        for elem in data:
                            elem["device"] = deviceType

                        print(f"POST {data} to dashboard/add_data/{user_id}/")
                        requests.post(
                            f"{post_host}/dashboard/add_data/{user_id}/",
                            json=data
                        )

        except websockets.ConnectionClosed:
            print("Connection Lost! Retrying...")
            continue

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('post_host', type=str, help="The host address to POST data to. Eg. http://127.0.0.1:8000")

    def handle(self, *args, **options):
        post_host = options['post_host']
        URL = f"wss://{os.environ.get('REHM_CLOUD_HOST')}/ws/data"
        print(f"Connecting to websocket server {URL}")
        asyncio.run(client(URL, post_host))