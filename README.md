# ReHM: Remote Health Monitoring
*A sample implementation of a Remote Health Monitoring system. Allows for the monitoring of patients as well as data collection for experiments.*

**Future Features**
* *Alert System*
* *ETL and incorporation of ML.*

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
* Sensor data is sent to the cloud host and the cloud host cleans the input data. Once the data is cleaned, it is broadcast to listeners within the local network. The listeners will then send the "cleaned data" to the local server and data will be handled by updating a real-time chart or stored in a MongoDB database.

![ReHM System Architecture (1)](https://user-images.githubusercontent.com/59156097/171967168-25459ab9-d5de-4487-8da5-d590f3bbe70c.jpg)

## Current JSON Data Format
```typescript
interface DataPoint {
    device: string,         // Apple Watch, Fitbit, Polar, Pozxy 
    dataType: string,       // HR, RR, ACCEL, GYRO, POS
    timestamp: number,      // UNIX TIMESTAMP
    dataValues: Array<number>          // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}
```
## Dashboard + DB Sequence Diagram

![ReHM System Architecture-Dashboard App Interaction with Database (2)](https://user-images.githubusercontent.com/59156097/173128029-a7ee3f73-8a3d-4a78-b5ce-865a63177a4a.jpg)

# Apps/Services

|      App      | Tech | Description|
|---------------|-------------| ------|
| Local WebApp  | Redis, MongoDB, Django Channels, Django, React | Serve the remote monitoring dashboard and handle storage and distribution of live data.|
| Local Listeners | Python, Websockets/MQTT | Accept the data from the Cloud Message Broker |
| Cloud Message Broker | Redis, Heroku, Django | Accept data from the sensors and process it into some standard format | 
|||
| Apple Watch Raw Data | Swift, HealthKit, CoreMotion | Send raw data from the Apple Watch to the Cloud Message Broker |
| PolarH10 Raw Data | Swift, Kotlin, Polar SDK | Send the raw data from the Polar Chest Strap to the Cloud Message Broker |
| Fitbit Raw Data | Javascript, Fitbit SDK | Send the raw data from the fitbit to the Cloud Message Broker |
| Pozyx Raw Data | ?????, Python, MQTT | Obtain the positional data from the Pozyx and send it to the cloud Message Broker | 

# Setup
## ReHM Dashboard
1. Set the following environment variables up in your OS.

| Key | Example |
|----|-----|
| SECRET_KEY | "somethingsup#)*&*)*secret" |
| DJANGO_ALLOWED_HOSTS | "127.0.0.1,localhost" |
| MONGO_DB_USER | "username" |
| MONGO_DB_PWD | "password" |
| MONGO_DB_ADDRESS | "127.0.0.1:27017" |


2. After Migrating the Database, upgrade the accounts_sensordata to a timeseries collection with metaField: "data_id"

        python manage.py makemigrations
        python manage.py migrate
        python manage.py createsuperuser
        
        docker exect -it mongodb bash
        mongosh -u [username] -p
        
        // Enter your DB password

        use ReHMdb
        db.accounts_sensordata.drop()
        db.createCollection("accounts_sensordata", {timeseries: {timeField: "timestamp", metaField: "data_id"})


