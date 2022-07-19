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

![ReHM System Architecture-Initial Planning drawio (3)](https://user-images.githubusercontent.com/59156097/179628133-b6fb4833-e058-4937-a9f3-899469432f8b.png)

## Current JSON Data Format
```typescript
interface DataPoint {
    device: string,         // Apple Watch, Fitbit, Polar, Pozxy 
    dataType: string,       // HR, RR, ACCEL, GYRO, POS
    timestamp: number,      // UNIX TIMESTAMP IN **Milliseconds** or UTC timestamp
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
| REHM_CLOUD_HOST | "iceland-walrus-552423.herokuapp.com" |
| REDIS_URL | "redis://localhost:6379" |

1. Create a Redis (https://collabnix.com/how-to-setup-and-run-redis-in-a-docker-container/) and MongoDB container in Docker (https://medium.com/@anuradhs/how-to-start-a-mongo-database-with-authentication-using-docker-container-8ce63da47a71). 

For a MongoDB Instance

    docker run --name mongodb -p 27017:27017 -v C:\Users\ML-3\Documents\MongoDBStorage:/data/db -d -e MONGO_INITDB_ROOT_USERNAME=<username> -e MONGO_INITDB_ROOT_PASSWORD=<password> mongo --auth

1. Migrate the database and create a superuser with

        python manage.py makemigrations
        python manage.py migrate
        python manage.py createsuperuser

1. After Migrating the Database, upgrade the accounts_sensordata to a timeseries collection with metaField: "data_id"


        docker exect -it mongodb bash
        mongosh -u [username] -p
        
        // Enter your DB password

        use ReHMdb
        db.accounts_sensordata.drop()
        db.createCollection("accounts_sensordata", {timeseries: {timeField: "timestamp", metaField: "data_id"})

1. Run the data ingestion script, replace <YOUR_HOST> with the host and port you will post incoming data to.

        python manage.py run_data_ingest http://<YOUR_HOST>

1. Run the server with Daphne. Example:

        daphne -b 0.0.0.0 -p 8001 django_project.asgi:application

# Debugging

## Curls
Some data flow debugging curls. Replace <> with your version of the required parameter. 

### Send data to the Cloud Broker

    curl -d "{\"data\": [{\"device_serial\": \"Fitbit12334\", \"timestamp\": 1656356068080, \"dataType\": \"HR\", \"dataValues\": [65.0]}]}" -H "Content-Type: application/json" -X POST https://<HOST_ADDRESS>/data/add_data
