// app.js

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const roi = document.getElementById("roi");

const movementValue =
document.getElementById("movementValue");

const statusDiv =
document.getElementById("status");

const thresholdInput =
document.getElementById("threshold");

const thresholdValue =
document.getElementById("thresholdValue");

const cooldownInput =
document.getElementById("cooldown");

let monitoring = false;
let previousROI = null;
let lastDetection = 0;
let detectionTimer = null;

//
// Inicialización
//

thresholdInput.addEventListener(
"input",
() => {
thresholdValue.innerText =
thresholdInput.value;
}
);

startCamera();

//
// Cámara
//

async function startCamera() {


try {

    const stream =
        await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

    video.srcObject = stream;

    statusDiv.innerText =
        "Cámara iniciada";

} catch (err) {

    console.error(err);

    statusDiv.innerText =
        "No se pudo acceder a la cámara";
}


}

//
// Botones
//

document
.getElementById("startBtn")
.addEventListener(
"click",
startMonitoring
);

document
.getElementById("stopBtn")
.addEventListener(
"click",
stopMonitoring
);

function startMonitoring() {


if (monitoring)
    return;

monitoring = true;

statusDiv.innerText =
    "Monitoreando...";

detectionLoop();


}

function stopMonitoring() {


monitoring = false;

statusDiv.innerText =
    "Monitoreo detenido";

if (detectionTimer)
    clearTimeout(
        detectionTimer
    );


}

//
// ROI movible
//

let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

roi.addEventListener(
"pointerdown",
startDrag
);

document.addEventListener(
"pointermove",
drag
);

document.addEventListener(
"pointerup",
stopDrag
);

function startDrag(e) {


dragging = true;

const rect =
    roi.getBoundingClientRect();

dragOffsetX =
    e.clientX - rect.left;

dragOffsetY =
    e.clientY - rect.top;


}

function drag(e) {


if (!dragging)
    return;

const parent =
    roi.parentElement;

const parentRect =
    parent.getBoundingClientRect();

let x =
    e.clientX -
    parentRect.left -
    dragOffsetX;

let y =
    e.clientY -
    parentRect.top -
    dragOffsetY;

x = Math.max(
    0,
    Math.min(
        x,
        parentRect.width -
        roi.offsetWidth
    )
);

y = Math.max(
    0,
    Math.min(
        y,
        parentRect.height -
        roi.offsetHeight
    )
);

roi.style.left =
    x + "px";

roi.style.top =
    y + "px";


}

function stopDrag() {


dragging = false;


}

//
// Detección
//

function detectionLoop() {


if (!monitoring)
    return;

processFrame();

detectionTimer =
    setTimeout(
        detectionLoop,
        500
    );


}

function processFrame() {


if (
    video.videoWidth === 0
) {
    return;
}

canvas.width =
    video.videoWidth;

canvas.height =
    video.videoHeight;

ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
);

const roiData =
    getROIData();

if (previousROI) {

    const movement =
        compareFrames(
            previousROI.data,
            roiData.data
        );

    movementValue.innerText =
        movement.toFixed(2);

    const threshold =
        Number(
            thresholdInput.value
        );

    if (
        movement >
        threshold
    ) {

        handleDetection(
            movement
        );
    }
}

previousROI = roiData;


}

function getROIData() {


const videoRect =
    video.getBoundingClientRect();

const roiRect =
    roi.getBoundingClientRect();

const scaleX =
    canvas.width /
    videoRect.width;

const scaleY =
    canvas.height /
    videoRect.height;

const x =
    (roiRect.left -
     videoRect.left)
    * scaleX;

const y =
    (roiRect.top -
     videoRect.top)
    * scaleY;

const w =
    roiRect.width *
    scaleX;

const h =
    roiRect.height *
    scaleY;

return ctx.getImageData(
    x,
    y,
    w,
    h
);


}

function compareFrames(
frameA,
frameB
) {


let changed = 0;

for (
    let i = 0;
    i < frameA.length;
    i += 16
) {

    const diff =
        Math.abs(
            frameA[i] -
            frameB[i]
        );

    if (diff > 25)
        changed++;
}

return changed / 100;


}

//
// Evento detectado
//

async function handleDetection(
movement
) {


const cooldownSeconds =
    Number(
        cooldownInput.value
    );

const cooldownMs =
    cooldownSeconds *
    1000;

const now =
    Date.now();

if (
    now - lastDetection <
    cooldownMs
) {
    return;
}

lastDetection = now;

statusDiv.innerText =
    "Movimiento detectado";

saveEvent(
    movement
);


}

//
// Persistencia local
//

function saveEvent(
movement
) {


const now =
    new Date();

const event = {

    timestamp:
        now.toISOString(),

    fecha:
        now
        .toISOString()
        .split("T")[0],

    hora:
        now
        .toTimeString()
        .split(" ")[0],

    movement:
        Number(
            movement
            .toFixed(2)
        )
};

let events =
    JSON.parse(
        localStorage.getItem(
            "catDetectorEvents"
        ) || "[]"
    );

events.push(
    event
);

localStorage.setItem(
    "catDetectorEvents",
    JSON.stringify(
        events
    )
);

statusDiv.innerText =
    "Evento guardado localmente";

console.log(
    event
);


}
