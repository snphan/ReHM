from django.core.management.base import BaseCommand 
import asyncio
import websockets
import os
import accounts.models as accnt_models
import json
from asgiref.sync import sync_to_async
import requests
import paho.mqtt.client as mqtt
from asyncio_mqtt import Client, MqttError
import ssl

# Preload Devices to prevent database hits
allDevices = accnt_models.Device.objects.all()
allDevices = allDevices.values()
allDevices_cache = list(allDevices)

def process_pozyx_message(msg, post_host):
    data = json.loads(msg.payload)
    for one_data in data:
        packet = {}
        timestamp = int(one_data['timestamp'] * 1000)
        serial = one_data['tagId']
        dataValues = list(one_data['data']['coordinates'].values())
        device_info = list(
            filter(lambda x: x["serial"] == serial, allDevices_cache)
        )

        if len(device_info) > 0:
            user_id = device_info[0]["user_id"]
            deviceType = device_info[0]["deviceType_id"]

            packet["device_serial"] = serial
            packet["device"] = deviceType
            packet["timestamp"] = timestamp
            packet["dataType"] = "POS"
            packet["dataValues"] = dataValues

            requests.post(
                f"{post_host}/dashboard/add_data/{user_id}/",
                json=[packet]
            )

async def rehm_cloud_client(uri, post_host):
    """Function to connect to the Cloud Broker, and process the data to match
    the interface required by the Dashboard application and the Database.

    Args:
    uri (str): URL of the websocket endpoint for cloud broker. Uses then environment
    variable REHM_CLOUD_HOST to construct.
        post_host (str): Host url of where to post the processed data to the dashboard.
    """
    global allDevices_cache
    # TODO: Update the cache when someone registeres a new device.a
    async for websocket in websockets.connect(uri):
        print("Connected to websocket server")
        try:
            async for message in websocket:
                parsed_message = json.loads(message)
                if "data" in parsed_message: 
                    data = parsed_message["data"]
                    serial = data[0]["device_serial"]

                    device_info = list(
                        filter(lambda x: x["serial"] == serial, allDevices_cache)
                    )
                    if len(device_info) > 0:
                        user_id = device_info[0]["user_id"]
                        deviceType = device_info[0]["deviceType_id"]

                        # Add the deviceType as per DataPoint interface
                        for elem in data:
                            elem["device"] = deviceType

                        # print(f"POST {data} to dashboard/add_data/{user_id}/")
                        requests.post(
                            f"{post_host}/dashboard/add_data/{user_id}/",
                            json=data
                        )

        except websockets.ConnectionClosed:
            print("Connection Lost! Retrying...")
            continue

async def pozyx_cloud_client(post_host):

    # TODO: Handle multiple topics
    host = "mqtt.cloud.pozyxlabs.com"
    port = 443
    topic = os.environ.get("POZYX_CLOUD_TOPIC")
    username = os.environ.get("POZYX_CLOUD_TOPIC")
    password = os.environ.get("POZYX_CLOUD_API")

    async with Client(hostname=host, port=port, transport="websockets", username=username, password=password, tls_context=ssl.create_default_context()) as client:
        async with client.unfiltered_messages() as messages:
            await client.subscribe(topic)
            async for message in messages:
                try:
                    process_pozyx_message(message, post_host)
                except KeyError as e:
                    print(f"KeyError {e}")

async def main(**options):
    post_host = options['post_host']
    URL = f"wss://{os.environ.get('REHM_CLOUD_HOST')}/ws/data"
    await asyncio.gather(
        rehm_cloud_client(URL, post_host),
        pozyx_cloud_client(post_host)
    )

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('post_host', type=str, help="The host address to POST data to. Eg. http://127.0.0.1:8000")

    def handle(self, *args, **options):
        asyncio.run(main(**options))
