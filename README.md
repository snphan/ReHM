# ReHM: Remote Health Monitoring
*A sample implementation of a Remote Health Monitoring system. Allows for the monitoring of patients as well as data collection for experiments.*

## Contributing

* **DO NOT UPLOAD PRIVATE/SECRET KEYS. THESE SHOULD BE SET IN AN ENVIRONMENT VARIABLE.**
* **DO NOT UPLOAD ANY API ENDPOINTS. THESE SHOULD BE SET IN AN ENVIRONMENT VARIABLE.**
* **DO NOT UPLOAD ANY DATABASE FILES.**
* **DO NOT UPLOAD ANY LINKS TO THE APPLICATIONS. ANY DEPLOYED SITES SHOULD BE STORED IN AN ENVIRONMENT VARIABLE.**
* **DO NOT UPLOAD ANY .ENVS FILES.**

# Screenshots (Figma Mockup)

![Dashboard (1)](https://user-images.githubusercontent.com/59156097/171966507-e47acbf2-a979-4b66-9829-adbf2b9290b1.png)

![Dashboard (2)](https://user-images.githubusercontent.com/59156097/171966550-ac9b486b-914f-4f6c-8381-c7ccbd60f10c.png)

# Current System Architecture

* Maintain security by keeping the server local. Web App will be served within a local network. 
* The only communication that happens outside is through a websocket to some cloud host that can act as a message broker (may consider MQTT, or Kafka in the future for scalability).
* **TODO:** A foreseable vulnerability occurs if malicious users connect and listen for user data without authorization. We can borrow some ideas from MQTT and setup authentication for the listeners that look like this.

![image](https://user-images.githubusercontent.com/59156097/171967878-c632f681-6f9f-4922-b8da-3d38d1b744df.png)

* Sensor data is sent to the cloud host and the cloud host cleans the input data. Once the data is cleaned, it is broadcast to listeners within the local network. The listeners will then send the "cleaned data" to the local server and data will be handled by updating a real-time chart or stored in a MongoDB database.

![ReHM System Architecture (1)](https://user-images.githubusercontent.com/59156097/171967168-25459ab9-d5de-4487-8da5-d590f3bbe70c.jpg)

# Apps/Services

|      App      | Tech | Description|
|---------------|-------------| ------|
| Local WebApp  | Redis, MongoDB, Django Channels, Django, React | Serve the remote monitoring dashboard and handle storage and distribution of live data.|
| Local Listeners | Python, Websockets/MQTT | Accept the data from the Cloud Message Broker |
| Cloud Message Broker | Redis, Heroku, Django | Accept data from the sensors and process it into some standard format | 
| Apple Watch Raw Data | Swift, HealthKit, CoreMotion | Send raw data from the Apple Watch to the Cloud Message Broker |
| PolarH10 Raw Data | Swift, Kotlin, Polar SDK | Send the raw data from the Polar Chest Strap to the Cloud Message Broker |
| Fitbit Raw Data | Javascript, Fitbit SDK | Send the raw data from the fitbit to the Cloud Message Broker |
| Pozyx Raw Data | ?????, Python, MQTT | Obtain the positional data from the Pozyx and send it to the cloud Message Broker | 

