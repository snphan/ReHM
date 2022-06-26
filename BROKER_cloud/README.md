# Cloud Broker

A lightweight API to route data from remote sensors, external to the local network, to the internal network. The API exposes an "add_data" endpoint for devices to POST data to. The internal server will connect to this "BROKER" through a WebSocket. Any POSTed data will be received by the internal server and processed accordingly.

Post to:

    /data/add_data

The data should have the format:

| Field | Type |
|-|-|
|device_serial | string|
| timestamp | int |
| dataType | string |
| dataValues | float[] |

This data should be placed in an object with a "data" field, and contained as a list. An example data structure is as follows:

```json
{
  data: [
    {
      device_serial: "APPLE712345",
      timestamp: 1600000789,
      dataType: "HR",
      dataValues: [120]
    },
    {
      device_serial: "APPLE712345",
      timestamp: 1600000790,
      dataType: "HR",
      dataValues: [121]
    }
  ]
}
```

# Running the API in DEV
After installing the dependencies, run the following command in the current directory (runs the "app" in main.py).

    uvicorn main:app --reload --host localhost --port 8000

Also setup a "REDIS_URL" in the environment variable to "redis://localhost:6379"

# Running on Heroku

Login to heroku and create a new app

    heroku login
    heroku create

Set the heroku git location

    heroku git:remote -a <my_app_name>

Push the BROKER_cloud application to your heroku app

    git subtree push --prefix BROKER_cloud heroku main


# Debugging

To check heroku logs use

    ✨ heroku logs --tail

_____

If you mess up the history in any way you will need to "force push"

In windows:

    git subtree split --prefix BROKER_cloud <branch_name>

This returns a "token"

    5801e154af5b2ad57d34b469cf398acef10c0ba0

push this token to heroku

    git push heroku 5801e154af5b2ad57d34b469cf398acef10c0ba0:main --force

