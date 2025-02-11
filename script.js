let audioCtx;
let oscillator;
let gainNode;
let filterNode;
let distortionNode;

// 🔹 Request motion sensor permission
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
        // No permission request needed on Android or older iOS
        startMotionTracking();
    } else {
        alert("Your browser does not support motion sensors.");
    }
});

// 🔹 Start/Stop Sound on Button Click
document.getElementById("toggleSound").addEventListener("click", () => {
    if (!audioCtx) {
        startAudio();
        document.getElementById("toggleSound").textContent = "Stop Sound";
    } else {
        stopAudio();
        document.getElementById("toggleSound").textContent = "Start Sound";
    }
});

// 🔹 Initialize Audio
function startAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

	// Create Oscillator (Sound Source)
    oscillator = audioCtx.createOscillator();
	oscillator.type = "sine"; // Wave type (sine, square, sawtooth)
    oscillator.frequency.value = 440; // Default pitch

	// Create Gain Node (Volume Control)
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.5; // Default volume

	// 🔹 Add a Low-Pass Filter (Muffles Sound at Higher Frequencies)
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = 1000; // Default frequency cutoff

    // 🔹 Add a Distortion Effect
    distortionNode = audioCtx.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(0); // No distortion at start
    distortionNode.oversample = "4x"; // Smoother distortion

	// Connect Nodes: Oscillator → Distortion → Filter → Gain → Output
    oscillator.connect(distortionNode);
    distortionNode.connect(filterNode);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
}

// 🔹 Stop Audio
function stopAudio() {
    if (oscillator) oscillator.stop();
    if (audioCtx) audioCtx.close();
    audioCtx = null;
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
