# Fitbit Publisher

A fitbit application that publishes to the Cloud Broker.

# ❗ Setup

Install the necessary node modules

    npm install

After you create the Cloud Heroku app, you need to point to it in a env.js file. Create a env.js file in this project and name it accordingly:

**/PUB_fitbit/env.js**

```javascript
export const env = {
    CLOUD_URL:"https://super-secret-herokuapp.com"
}
```

Then activate the fitbit CLI

    npx fitbit

Turn on the **developer bridge** on both the phone and the device. Then connect your phone and device if you haven't already.

    (fitbit) $ connect phone
    (fitbit) $ connect device


Build and install to get the fitbit app onto your device.

    (fitbit) $ build-and-install