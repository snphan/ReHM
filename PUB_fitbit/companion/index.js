import * as messaging from "messaging";
messaging.peerSocket.addEventListener("message", (evt) => {
  console.log("Hello world")
});