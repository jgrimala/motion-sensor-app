let audioCtx;
let noiseSource;
let gainNode;
let filter1, filter2, filter3;
let reverb;
let motionTracking = false;

// 🔹 Request Motion Permission
document.getElementById("requestPermission").addEventListener("click", async () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === "granted") {
                startMotionTracking();
            } else {
                alert("Motion sensor permission denied.");
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
        }
    } else if (typeof DeviceMotionEvent !== "undefined") {
        startMotionTracking();
    } else {
        alert("Your browser does not support motion sensors.");
    }
});

// 🔹 Start/Stop Sound
document.getElementById("toggleSound").addEventListener("click", () => {
    let selectedNoise = document.getElementById("noiseType").value;

    if (!audioCtx) {
        startAudio(selectedNoise);
        document.getElementById("toggleSound").textContent = "Stop Sound";
    } else {
        stopAudio();
        document.getElementById("toggleSound").textContent = "Start Sound";
    }
});

// 🔹 Stop & Reset Button
document.getElementById("resetSound").addEventListener("click", () => {
    stopAudio();
    resetFilters();
    document.getElementById("toggleSound").textContent = "Start Sound";
});

// 🔹 Initialize Audio with Resonant Filters & Reverb
function startAudio(noiseType = "white") {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 🔹 Create Noise Source
    let noiseBuffer = generateNoise(noiseType);
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // 🔹 Create Gain Node (Volume Control)
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.5;

    // 🔹 Create Multiple Resonant Bandpass Filters
    filter1 = audioCtx.createBiquadFilter();
    filter1.type = "bandpass";
    filter1.frequency.value = 400;
    filter1.Q.value = 10;

    filter2 = audioCtx.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.value = 800;
    filter2.Q.value = 10;

    filter3 = audioCtx.createBiquadFilter();
    filter3.type = "bandpass";
    filter3.frequency.value = 1600;
    filter3.Q.value = 10;

    // 🔹 Add Reverb
    reverb = audioCtx.createConvolver();
    loadReverbImpulse(reverb);

    // 🔹 Connect Nodes: Noise → Filters → Reverb → Gain → Output
    noiseSource.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(filter3);
    filter3.connect(reverb);
    reverb.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();
}

// 🔹 Stop Audio
function stopAudio() {
    if (noiseSource) noiseSource.stop();
    if (audioCtx) audioCtx.close();
    audioCtx = null;
    window.removeEventListener("deviceorientation", updateSoundFilters);
}

// 🔹 Reset Sound Filter Parameters
function resetFilters() {
    if (filter1) filter1.frequency.value = 400;
    if (filter2) filter2.frequency.value = 800;
    if (filter3) filter3.frequency.value = 1600;
}

// 🔹 Generate Noise Buffer
function generateNoise(type = "white") {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0;

    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        if (type === "white") output[i] = white;
        else if (type === "pink") output[i] = (lastOut + (0.02 * white)) / 1.02, lastOut = output[i];
        else if (type === "brown") output[i] = lastOut = (lastOut * 0.99) + (0.01 * white);
    }

    return noiseBuffer;
}

// 🔹 Load Reverb Impulse
function loadReverbImpulse(convolver) {
    fetch("https://cdn.freesound.org/reverb-impulse-response.wav")
        .then(response => response.arrayBuffer())
        .then(data => audioCtx.decodeAudioData(data, buffer => {
            convolver.buffer = buffer;
        }))
        .catch(error => console.error("Reverb loading failed:", error));
}

// 🔹 Motion-Controlled Sound Filters
function startMotionTracking() {
    window.removeEventListener("deviceorientation", updateSoundFilters);
    window.addEventListener("deviceorientation", updateSoundFilters);
}

function updateSoundFilters(event) {
    filter1.frequency.value = 400 + event.beta * 20;
    filter2.frequency.value = 800 + event.gamma * 10;
    filter3.frequency.value = 1600 - event.gamma * 5;
}
