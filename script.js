let audioCtx;
let noiseSource = null;
let gainNode;
let filter1, filter2, filter3;
let reverb;
let motionTracking = false;

// Versioning
const versionKey = "appVersion";
let version = localStorage.getItem(versionKey) || 1;
version = parseFloat(version) + 0.1;
localStorage.setItem(versionKey, version.toFixed(1));

document.title = `Motion-Sensor App v${version.toFixed(1)}`;
document.getElementById("appHeader").textContent = `Motion-Sensor App v${version.toFixed(1)}`;

// Request Motion Permission
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

// Start/Stop Sound
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

// Start Audio
function startAudio(noiseType = "white") {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioCtx.resume().then(() => {
        if (noiseSource) {
            noiseSource.stop();
            noiseSource.disconnect();
        }

        let osc1 = audioCtx.createOscillator();
        let osc2 = audioCtx.createOscillator();
        let osc3 = audioCtx.createOscillator();

        osc1.frequency.value = 220;
        osc2.frequency.value = 440;
        osc3.frequency.value = 660;

        osc1.type = "sine";
        osc2.type = "sine";
        osc3.type = "sine";

        let oscGain = audioCtx.createGain();
        oscGain.gain.value = 0.2;

        osc1.connect(oscGain);
        osc2.connect(oscGain);
        osc3.connect(oscGain);

        let noiseBuffer = generateNoise(noiseType);
        noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.4;

        filter1 = audioCtx.createBiquadFilter();
        filter1.type = "bandpass";
        filter1.frequency.value = 440;
        filter1.Q.value = 20;

        filter2 = audioCtx.createBiquadFilter();
        filter2.type = "bandpass";
        filter2.frequency.value = 660;
        filter2.Q.value = 15;

        filter3 = audioCtx.createBiquadFilter();
        filter3.type = "bandpass";
        filter3.frequency.value = 880;
        filter3.Q.value = 10;

        reverb = createSimpleReverb();

        noiseSource.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(filter3);
        filter3.connect(reverb);
        reverb.connect(gainNode);
        oscGain.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        noiseSource.start();
        osc1.start();
        osc2.start();
        osc3.start();

        startMotionTracking();
    }).catch(error => console.error("AudioContext Resume Failed:", error));
}

// Stop Audio
function stopAudio() {
    if (noiseSource) {
        noiseSource.stop();
        noiseSource.disconnect();
        noiseSource = null;
    }

    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }

    window.removeEventListener("deviceorientation", updateSoundFilters);
}

// Generate Noise
function generateNoise(type = "white") {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        if (type === "white") {
            output[i] = white;
        } else if (type === "pink") {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
        }
    }

    return noiseBuffer;
}
