import * as messaging from "messaging";
import { env } from "./env";
import { settingsStorage } from "settings";

// Restore any previously saved settings and send to the device
function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key) {
      let data = {
        key: key,
        newValue: settingsStorage.getItem(key)
      };
      sendVal(data);
    }
  }
}

// Send data to device using Messaging API
function sendVal(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  }
}

messaging.peerSocket.onopen = () => {
  restoreSettings();
}

settingsStorage.onchange = evt => {
  let data = {
    key: evt.key,
    newValue: evt.newValue
  };
  sendVal(data);
};

messaging.peerSocket.addEventListener("message", (evt) => {
  let payload = JSON.stringify(evt.data);
  fetch(`${env.CLOUD_URL}/data/add_data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: payload
  })
});