import * as messaging from "messaging";
import { env } from "./env";

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