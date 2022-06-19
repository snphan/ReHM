import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.patient_id = self.scope['url_route']['kwargs']['room_name']
        self.patient_group_name = '%s' % self.patient_id

        # Join patient group
        await self.channel_layer.group_add(
            self.patient_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave Patient view
        await self.channel_layer.group_discard(
            self.patient_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.patient_group_name,
            {
                'type': 'patient_data',
                'message': message
            }
        )

    # Receive message from room group
    async def patient_data(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))