import logging
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from starlette.websockets import WebSocketDisconnect

import os

import aioredis
from aioredis.client import PubSub, Redis
import asyncio


class Data(BaseModel):
    device_serial: str
    timestamp: int
    data_type: str
    val: float

app = FastAPI()
logger = logging.getLogger(__name__)

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>%s Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            let host = window.location.host;
            let protocol = (window.location.protocol === "https:") ? "wss" : "ws";
            var ws = new WebSocket(`${protocol}://${host}/ws/%s`);
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.prepend(content)
                messages.prepend(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""

# curl -d "{\"device_serial\": \"Apple Watch\",\"data_type\": \"HR\", \"timestamp\": 16660999878, \"val\": 120}" -H "Content-Type: application/json" -X POST http://localhost:8000/data/add_data
@app.post("/data/add_data")
async def add_data(data: Data):
    conn = await get_redis_pool()
    await conn.publish("chat:c", data.json())

    return {"message": "data added successfully!"}

@app.get("/")
async def get():
    return {"message": "Welcome to the BROKER_cloud app, we ingest data!"}

@app.get("/debug/{room_name}")
async def get(room_name: str):
    # Connect to the data room and sniff the data stream for debugging purposes
    return HTMLResponse(html % (room_name, room_name))

@app.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name):
    await websocket.accept()
    await redis_connector(websocket)

async def redis_connector(websocket: WebSocket):
    async def consumer_handler(conn: Redis, ws: WebSocket):
        try:
            while True:
                message = await ws.receive_text()
                if message:
                    await conn.publish("chat:c", message)
        except WebSocketDisconnect as exc:
            # TODO this needs handling better
            logger.error(exc)

    async def producer_handler(pubsub: PubSub, ws: WebSocket):
        await pubsub.subscribe("chat:c")
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True)
                if message:
                    await ws.send_text(message.get('data'))
        except Exception as exc:
            # TODO this needs handling better
            logger.error(exc)

    conn = await get_redis_pool()
    pubsub = conn.pubsub()

    consumer_task = consumer_handler(conn=conn, ws=websocket)
    producer_task = producer_handler(pubsub=pubsub, ws=websocket)
    done, pending = await asyncio.wait(
        [consumer_task, producer_task], return_when=asyncio.FIRST_COMPLETED,
    )
    logger.debug(f"Done task: {done}")
    for task in pending:
        logger.debug(f"Canceling task: {task}")
        task.cancel()


async def get_redis_pool():
    return await aioredis.from_url(os.environ.get("REDIS_URL"), encoding="utf-8", decode_responses=True)
