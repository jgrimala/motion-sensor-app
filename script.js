let audioCtx;
let oscillator;
let gainNode;

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
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = "sine"; // Wave type (sine, square, sawtooth)
    oscillator.frequency.value = 440; // Default pitch
    gainNode.gain.value = 0.5; // Default volume

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

// 🔹 Start Tracking Motion Data
function startMotionTracking() {
    window.addEventListener("deviceorientation", (event) => {
        let pitch = Math.abs(event.beta); // Front/Back tilt
        let volume = Math.abs(event.gamma) / 90; // Side tilt (scaled)

        if (audioCtx) {
            oscillator.frequency.value = 200 + pitch * 2; // Map tilt to frequency
            gainNode.gain.value = Math.max(0.1, Math.min(1, volume)); // Keep volume in range
        }

        // Update UI
        document.getElementById("pitch").textContent = oscillator.frequency.value.toFixed(2);
        document.getElementById("volume").textContent = gainNode.gain.value.toFixed(2);
    });
}
