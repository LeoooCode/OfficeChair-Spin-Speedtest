const ctx = document.getElementById("speedCanvas").getContext("2d");

const gameState = {
  running: false,
  lastRealRadians: 0,
  lastRadians: 0,
};

function drawScene() {
  ctx.clearRect(0, 0, 1000, 1000);

  ctx.lineWidth = 10;
  ctx.strokeStyle = "#7280fd";

  ctx.beginPath();
  ctx.arc(500, 500, 400, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#002cdf";

  ctx.beginPath();
  ctx.arc(
    Math.sin(gameState.lastRadians + Math.PI) * 400 + 500,
    Math.cos(gameState.lastRadians + Math.PI) * 400 + 500,
    40,
    0,
    2 * Math.PI
  );
  ctx.stroke();
}

function gameTick() {
  if (!gameState.running) {
    gameState.lastRadians = gameState.lastRadians / 1.03;
    if (gameState.lastRadians >= 0.01) gameState.lastRadians -= 0.01;
    if (gameState.lastRadians <= -0.01) gameState.lastRadians += 0.01;
  }

  drawScene();
  setTimeout(gameTick, 25);
}

gameTick();

function initSensor() {
  const sensor = new RelativeOrientationSensor({
    frequency: 60,
    referenceFrame: "device",
  });
  sensor.start();

  sensor.addEventListener("reading", () => {
    const [x, y, z, w] = sensor.quaternion;
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = -Math.atan2(siny_cosp, cosy_cosp);

    let tYaw = yaw;
    let lRad = gameState.lastRealRadians;
    if (
      Math.sign(lRad) != Math.sign(yaw) &&
      Math.abs(lRad) > Math.PI / 2 &&
      Math.abs(yaw) > Math.PI / 2
    ) {
      if (yaw > 0) tYaw = -2 * Math.PI + tYaw;
      else lRad = -2 * Math.PI + lRad;
    }
    const diff = lRad - tYaw;

    gameState.lastRealRadians = yaw;

    if (gameState.running) {
      gameState.lastRadians = yaw;
    } else {
      gameState.lastRadians -= diff / 1.7;
    }

    drawScene();
  });

  sensor.addEventListener("error", (error) => {
    if (error.name == "NotReadableError") {
      alert("Sensor is not available.");
    }
  });
}

// Request & check permissions

if (navigator.permissions) {
  Promise.all([
    navigator.permissions.query({ name: "accelerometer" }),
    navigator.permissions.query({ name: "gyroscope" }),
  ])
    .then((results) => {
      if (results.every((result) => result.state === "granted")) {
        initSensor();
      } else {
        alert("Permission to use sensor was denied.");
      }
    })
    .catch((err) => {
      console.log(
        "Integration with Permissions API is not enabled, still try to start app."
      );
      initSensor();
    });
} else {
  console.log("No Permissions API, still try to start app.");
  initSensor();
}



// MDC

const buttonRipple = new mdc.ripple.MDCRipple(document.querySelector('.mdc-button'));