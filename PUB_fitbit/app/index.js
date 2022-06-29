import { Accelerometer } from "accelerometer";
import { Barometer } from "barometer";
import { BodyPresenceSensor } from "body-presence";
import { display } from "display";
import * as document from "document";
import { Gyroscope } from "gyroscope";
import { HeartRateSensor } from "heart-rate";
import { OrientationSensor } from "orientation";
import { peerSocket } from "messaging";
import { me } from "appbit";

me.appTimeoutEnabled = false;

const accelLabel = document.getElementById("accel-label");
const accelData = document.getElementById("accel-data");

const barLabel = document.getElementById("bar-label");
const barData = document.getElementById("bar-data");

const bpsLabel = document.getElementById("bps-label");
const bpsData = document.getElementById("bps-data");

const gyroLabel = document.getElementById("gyro-label");
const gyroData = document.getElementById("gyro-data");

const hrmLabel = document.getElementById("hrm-label");
const hrmData = document.getElementById("hrm-data");

const orientationLabel = document.getElementById("orientation-label");
const orientationData = document.getElementById("orientation-data");

const sensors = [];

let accelDataHandler = undefined;
let hrDataHandler = undefined;



/**
 * Data handler class to collect data and send the data to the companion app.
 */
class DataHandler {
  constructor(frequency, dataType, serial = "12345") {
    this.dataQueue = [];
    this.frequency = frequency;
    this.dataType = dataType
    this.serial = serial
  }

  setSerial(newSerial) {
    this.serial = newSerial;
  }

  addData(val) {
    const data = {
      device_serial: this.serial,
      timestamp: Date.now(),
      dataType: this.dataType,
      dataValues: val
    };
    this.dataQueue.push(data)
    // Send data to companion every second
    if (this.dataQueue.length >= this.frequency) {
      this.sendMessage();
      this.dataQueue = []
    }
  }

  sendMessage() {
    const datapacket = {
      data: this.dataQueue
    };

    if (peerSocket.readyState === peerSocket.OPEN) {
      peerSocket.send(datapacket);
    }
  }

}

/**
 * Set the serial of the device based on the settings
 * @param {*} evt Message from the companion
 */
peerSocket.onmessage = (evt) => {
  if (evt.data.key === "serial") {
    let newSerial = JSON.parse(evt.data.newValue)["name"];
    if (accelDataHandler) {
      accelDataHandler.setSerial(newSerial);
    }
    if (hrDataHandler) {
      hrDataHandler.setSerial(newSerial);
    }
  }
}

if (Accelerometer) {
  const accel = new Accelerometer({ frequency: 3 });
  accelDataHandler = new DataHandler(accel.frequency, "ACCEL")
  accel.addEventListener("reading", () => {
    accelData.text = JSON.stringify({
      x: accel.x ? accel.x.toFixed(1) : 0,
      y: accel.y ? accel.y.toFixed(1) : 0,
      z: accel.z ? accel.z.toFixed(1) : 0
    });
    let data = [
      accel.x ? parseFloat(accel.x.toFixed(1)) : 0,
      accel.y ? parseFloat(accel.y.toFixed(1)) : 0,
      accel.z ? parseFloat(accel.z.toFixed(1)) : 0,
    ];
    accelDataHandler.addData(data)
  });
  sensors.push(accel);
  accel.start();
} else {
  accelLabel.style.display = "none";
  accelData.style.display = "none";
}

if (Barometer) {
  const barometer = new Barometer({ frequency: 1 });
  barometer.addEventListener("reading", () => {
    barData.text = JSON.stringify({
      pressure: barometer.pressure ? parseInt(barometer.pressure) : 0
    });
  });
  sensors.push(barometer);
  barometer.start();
} else {
  barLabel.style.display = "none";
  barData.style.display = "none";
}

if (BodyPresenceSensor) {
  const bps = new BodyPresenceSensor();
  bps.addEventListener("reading", () => {
    bpsData.text = JSON.stringify({
      presence: bps.present
    })
  });
  sensors.push(bps);
  bps.start();
} else {
  bpsLabel.style.display = "none";
  bpsData.style.display = "none";
}

if (Gyroscope) {
  const gyro = new Gyroscope({ frequency: 1 });
  gyro.addEventListener("reading", () => {
    gyroData.text = JSON.stringify({
      x: gyro.x ? gyro.x.toFixed(1) : 0,
      y: gyro.y ? gyro.y.toFixed(1) : 0,
      z: gyro.z ? gyro.z.toFixed(1) : 0,
    });
  });
  sensors.push(gyro);
  gyro.start();
} else {
  gyroLabel.style.display = "none";
  gyroData.style.display = "none";
}

if (HeartRateSensor) {
  const hrm = new HeartRateSensor({ frequency: 1 });
  hrDataHandler = new DataHandler(hrm.frequency, "HR")
  hrm.addEventListener("reading", () => {
    hrmData.text = JSON.stringify({
      heartRate: hrm.heartRate ? hrm.heartRate : 0
    });
    let data = [hrm.heartRate ? hrm.heartRate : 0];
    hrDataHandler.addData(data);
  });
  sensors.push(hrm);
  hrm.start();
} else {
  hrmLabel.style.display = "none";
  hrmData.style.display = "none";
}

if (OrientationSensor) {
  const orientation = new OrientationSensor({ frequency: 60 });
  orientation.addEventListener("reading", () => {
    orientationData.text = JSON.stringify({
      quaternion: orientation.quaternion ? orientation.quaternion.map(n => n.toFixed(1)) : null
    });
  });
  sensors.push(orientation);
  orientation.start();
} else {
  orientationLabel.style.display = "none";
  orientationData.style.display = "none";
}

display.addEventListener("change", () => {
  // Automatically stop all sensors when the screen is off to conserve battery
  // display.on ? sensors.map(sensor => sensor.start()) : sensors.map(sensor => sensor.stop());
});
