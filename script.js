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

// 🔹 Stop & Reset Button Functionality
document.getElementById("resetSound").addEventListener("click", () => {
    stopAudio();
    resetFilters();
    document.getElementById("toggleSound").textContent = "Start Sound";
});

// 🔹 Reset Sound Filter Parameters
function resetFilters() {
    if (filterNode) {
        filterNode.frequency.value = 500; // Default Center Frequency
        filterNode.Q.value = 5; // Default Bandwidth
    }
    if (distortionNode) {
        distortionNode.curve = makeDistortionCurve(0); // No distortion
    }

    // Reset UI values
    document.getElementById("pitch").textContent = "500";
    document.getElementById("volume").textContent = "5";
}

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

// 🔹 Initialize Audio with Bandpass Filter
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

    // 🔹 Add a Bandpass Filter (Dynamic Frequency Shift)
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "bandpass";
    filterNode.frequency.value = 500; // Center frequency (default)
    filterNode.Q.value = 5; // Bandwidth (default)

    // 🔹 Add a Distortion Effect
    distortionNode = audioCtx.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(0); // No distortion at start
    distortionNode.oversample = "4x"; // Smoother distortion

    // Connect Nodes: Noise → Distortion → Bandpass Filter → Gain → Output
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
			lastOut += 0.02 * white;
            output[i] = lastOut;
            if (lastOut > 1) lastOut = 1;
            if (lastOut < -1) lastOut = -1;
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

// 🔹 Motion-Controlled Bandpass Filter & Distortion
function startMotionTracking() {
    window.addEventListener("deviceorientation", (event) => {
        let pitch = Math.abs(event.beta); // Forward/Backward tilt
        let roll = Math.abs(event.gamma); // Side tilt

        // 🔹 Adjust Bandpass Filter Frequency Based on Forward Tilt
        let centerFreq = 300 + pitch * 30; // Move center frequency from 300Hz to ~2700Hz
        filterNode.frequency.value = centerFreq;

        // 🔹 Adjust Bandwidth (Q Factor) Based on Side Tilt
        let qFactor = 2 + (roll / 90) * 8; // Adjust Q from 2 to 10
        filterNode.Q.value = qFactor;

        // 🔹 Adjust Distortion Based on Side Tilt
        let distortionAmount = roll / 90 * 400; // Scale tilt to distortion intensity
        distortionNode.curve = makeDistortionCurve(distortionAmount);

        // 🔹 Update UI
        document.getElementById("pitch").textContent = centerFreq.toFixed(2);
        document.getElementById("volume").textContent = qFactor.toFixed(2);
    });
}
