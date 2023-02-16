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

![ReHM System Architecture-Initial Planning drawio (1)](https://user-images.githubusercontent.com/59156097/186064372-d5e06747-0959-49f5-bfff-39322b950e42.png)

## Data Formats

### Data Format Device Sends to Cloud
```typescript
{
  device_serial: string,       // Eg. APPLE12345
  dataType: string,            // HR, RR, ACCEL, GYRO, POS
  timestamp: number,           // UNIX TIMESTAMP IN **Milliseconds** or UTC timestamp
  dataValues: Array<number>    // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}
```

### Data after Processed by Run_data_ingest:
```typescript
{
  device: string,              // Apple Watch, Fitbit, Polar, Pozxy 
  device_serial: string,       // Eg. APPLE12345
  dataType: string,            // HR, RR, ACCEL, GYRO, POS
  timestamp: number,           // UNIX TIMESTAMP IN **Milliseconds** or UTC timestamp
  dataValues: Array<number>    // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}
```

### Data in DB
```typescript
{
  patient: number,             // patient id
  device: string,              // Apple Watch, Fitbit, Polar, Pozxy 
  dataType: string,            // HR, RR, ACCEL, GYRO, POS
  timestamp: number,           // UNIX TIMESTAMP IN **Milliseconds** or UTC timestamp
  dataValues: string           // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}
```

### Data Format sent to Dashboard Web App.
```typescript
interface DataPoint {
    device: string,              // Apple Watch, Fitbit, Polar, Pozxy 
    dataType: string,            // HR, RR, ACCEL, GYRO, POS
    timestamp: number,           // UNIX TIMESTAMP IN **Milliseconds** or UTC timestamp
    dataValues: Array<number>    // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}
```

## Dashboard + DB Sequence Diagram

![ReHM System Architecture-Dashboard App Interaction with Database drawio](https://user-images.githubusercontent.com/59156097/195622367-df81bb52-8a9a-48ec-995a-03f8317a48ed.png)

# Apps/Services

|      App      | Tech | Description|
|---------------|-------------| ------|
| Local WebApp  | Redis, TimescaleDB, Django Channels, Django, React | Serve the remote monitoring dashboard and handle storage and distribution of live data.|
| Local Listeners | Python, Websockets/MQTT | Accept the data from the Cloud Message Broker |
| Cloud Message Broker | Redis, Heroku, FastAPI | Accept data from the sensors and process it into some standard format | 
|||
| Apple Watch Raw Data | Swift, HealthKit, CoreMotion | Send raw data from the Apple Watch to the Cloud Message Broker |
| PolarH10 Raw Data | Swift, Kotlin, Polar SDK | Send the raw data from the Polar Chest Strap to the Cloud Message Broker |
| Fitbit Raw Data | Javascript, Fitbit SDK | Send the raw data from the fitbit to the Cloud Message Broker |
| Pozyx Raw Data | Python, MQTT | Obtain the positional data from the Pozyx and send it to the cloud Message Broker, https://app.pozyx.io/login | 

# Setup
## ReHM Dashboard
1. Set the following environment variables up in your OS.

| Key | Example |
|----|-----|
| SECRET_KEY | "somethingsup#)*&*)*secret" |
| DJANGO_ALLOWED_HOSTS | "127.0.0.1,localhost" |
| REHM_DB_USER | "username" |
| REHM_DB_PWD | "password" |
| REHM_DB_ADDRESS | "127.0.0.1:5432" |
| REHM_CLOUD_HOST | "iceland-walrus-552423.herokuapp.com" |
| REDIS_URL | "redis://localhost:6379" |
| POZYX_CLOUD_API | "api key from your pozyx setup |
| POZYX_CLOUD_TOPIC | "pozyx cloud topic" |

1. Create a Redis (https://collabnix.com/how-to-setup-and-run-redis-in-a-docker-container/) and TimescaleDB container in Docker. 

For a TimescaleDB Instance

    docker run -d --name timescaledb -p 5433:5432 -e POSTGRES_PASSWORD=password timescale/timescaledb:pg14-latest

1. Create the rehmdb database: 

        docker exec -it timescaledb bash
        psql -U postgres -W
        
        // Enter your DB password

        // Create the database
        CREATE DATABASE rehmdb;

1. Migrate the database and create a superuser with

        python manage.py makemigrations
        python manage.py migrate

1. After Migrating the Database, upgrade the accounts_sensordata to a hypertable: 

        docker exec -it timescaledb bash
        psql -U postgres -W
        
        // Enter your DB password

        // Connect to the rehmdb database.
        \c rehmdb

        // Remove the primary index on the accounts_sensordata (necessary to make hypertable)
        \d+ accounts_sensordata // Checks the constraints on the table
        ALTER TABLE accounts_sensordata DROP CONSTRAINT accounts_sensordata_pkey;

        // Create the hypertable on accounts_sensordata
        SELECT create_hypertable('accounts_sensordata', 'timestamp');

1. Seed the database 

        python manage.py seeddb --fresh <y/n> --gen_data <# of data>

1. Run the data ingestion script, replace <YOUR_HOST> with the host and port you will post incoming data to.

        python manage.py run_data_ingest http://<YOUR_HOST>

1. Run the server. Example:

        python manage.py runserver <YOUR_HOST>

# Debugging

## Curls
Some data flow debugging curls. Replace <> with your version of the required parameter. 

### Send data to the Cloud Broker

    curl -d "{\"data\": [{\"device_serial\": \"Fitbit12334\", \"timestamp\": 1656356068080, \"dataType\": \"HR\", \"dataValues\": [65.0]}]}" -H "Content-Type: application/json" -X POST https://<HOST_ADDRESS>/data/add_data
    
    
## Posts seem laggy?

Check if you are sending data to localhost. If you are switch to 127.0.0.1.
