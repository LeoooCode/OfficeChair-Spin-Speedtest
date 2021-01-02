const ctx = document.getElementById("speedCanvas").getContext("2d");
const playButton = document.getElementById("playButton");
const mainNumber = document.getElementById("mainNumber");
const mainNumberText = document.getElementById("mainNumberText");

const GAME_TICK = 50;
const TOTAL_TIME = 10000;

const gameState = {
  running: false,
  lastRealRadians: 0,
  lastRadians: 0,
  distanceTraveled: 0,
  distanceUntilLastTick: 0,
  timePassed: 0,
  graph: []
};

function drawScene() {
  ctx.clearRect(0, 0, 1000, 1000);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#304FFE";

  ctx.beginPath();
  ctx.moveTo(100, 500);
  const max = gameState.graph.reduce((max, curr) => Math.max(max, Math.abs(curr)), 0);
  gameState.graph.forEach((num, ind) => ctx.lineTo(100 + ind * (800 / (TOTAL_TIME / GAME_TICK)), 500 - 100 / max * num));
  ctx.stroke();

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

function fail(reason) {
  alert(reason);
  document.getElementById("fatalError").style.display = "block";
  playButton.style.display = "none";
}

function gameTick() {
  if (gameState.running) {
    const diff = Math.sign(gameState.distanceTraveled)*(gameState.distanceTraveled - gameState.distanceUntilLastTick);
    console.log(gameState.distanceTraveled, diff);
    gameState.graph.push(diff);
    gameState.distanceUntilLastTick = gameState.distanceTraveled;
    gameState.timePassed += GAME_TICK;

    mainNumberText.innerText = (Math.abs(gameState.distanceTraveled) / Math.PI * 2 / (gameState.timePassed/1000/60)).toFixed(1);
  } else {
    gameState.lastRadians = gameState.lastRadians / 1.03;
    if (gameState.lastRadians >= 0.01) gameState.lastRadians -= 0.01;
    if (gameState.lastRadians <= -0.01) gameState.lastRadians += 0.01;
  }

  drawScene();
  setTimeout(gameTick, GAME_TICK);
}

gameTick();

function play() {
  playButton.style.display = "none";
  mainNumber.style.display = "block";
  mainNumber.classList.add("countdown");

  mainNumberText.innerText = "3";
  setTimeout(() => (mainNumberText.innerText = "2"), 1000-10);
  setTimeout(() => (mainNumberText.innerText = "1"), 2000-10);
  setTimeout(() => (mainNumberText.innerText = "GO"), 3000-10);
  setTimeout(() => {
    mainNumber.classList.remove("countdown");
    gameState.running = true;
    mainNumberText.innerText = "0.0";
  }, 3300);
}

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
      gameState.distanceTraveled += diff;
    } else {
      gameState.lastRadians -= diff / 1.7;
    }

    drawScene();
  });

  sensor.addEventListener("error", (error) => {
    if (error.name == "NotReadableError") {
      fail("Sensor is not available.");
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
        fail("Permission to use sensor was denied.");
      }
    })
    .catch((err) => {
      console.warn(
        "Integration with Permissions API is not enabled, still try to start app."
      );
      initSensor();
    });
} else {
  console.warn("No Permissions API, still try to start app.");
  initSensor();
}

// MDC

const buttonRipple = new mdc.ripple.MDCRipple(
  document.querySelector(".mdc-button")
);
