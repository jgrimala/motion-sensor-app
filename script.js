let audioCtx;
let noiseSource;
let gainNode;
let filterNode;
let distortionNode;

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

// 🔹 Initialize Audio with Filters
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

    // 🔹 Add a Low-Pass Filter (Muffles Sound at Higher Frequencies)
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = 1000; // Default frequency cutoff

    // 🔹 Add a Distortion Effect
    distortionNode = audioCtx.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(0); // No distortion at start
    distortionNode.oversample = "4x"; // Smoother distortion

    // Connect Nodes: Noise → Distortion → Filter → Gain → Output
    noiseSource.connect(distortionNode);
    distortionNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();
}

// 🔹 Stop Audio
function stopAudio() {
    if (noiseSource) noiseSource.stop();
    if (audioCtx) audioCtx.close();
    audioCtx = null;
}

// 🔹 Generate Noise Buffer
function generateNoise(type = "white") {
    const bufferSize = 2 * audioCtx.sampleRate; // 2 seconds of sound
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0; // Used for Pink/Brown noise smoothing

    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1; // Base white noise

        if (type === "white") {
            output[i] = white; // Pure white noise
        } else if (type === "pink") {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
        } else if (type === "brown") {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i] * 3.5; // Deeper low-end
        }
    }

    return noiseBuffer;
}

// 🔹 Create Distortion Curve
function makeDistortionCurve(amount) {
    let n_samples = 256,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        let x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}

// 🔹 Motion-Controlled Sound Filters
function startMotionTracking() {
    window.addEventListener("deviceorientation", (event) => {
        let pitch = Math.abs(event.beta); // Forward/Backward tilt
        let roll = Math.abs(event.gamma); // Side tilt
        
        // 🔹 Adjust Low-Pass Filter Based on Forward Tilt
        let cutoffFreq = 300 + pitch * 20; // Higher tilt → Higher cutoff frequency
        filterNode.frequency.value = cutoffFreq;

        // 🔹 Adjust Distortion Based on Side Tilt
        let distortionAmount = roll / 90 * 400; // Scale tilt to distortion intensity
        distortionNode.curve = makeDistortionCurve(distortionAmount);

        // 🔹 Update UI
        document.getElementById("pitch").textContent = cutoffFreq.toFixed(2);
        document.getElementById("volume").textContent = (distortionAmount / 400).toFixed(2);
    });
}
