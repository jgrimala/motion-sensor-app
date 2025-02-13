let audioCtx;
let noiseSource = null;
let gainNode;
let filter1, filter2, filter3;
let reverb;
let isMuted = false;
let prevPitch = 0, prevRoll = 0;

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

// 🔹 Start/Stop Sound (Unified Button)
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

// 🔹 Start Audio
function startAudio(noiseType = "white") {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } else {
        audioCtx.resume();
        return;
    }

    audioCtx.resume().then(() => {
        if (noiseSource) {
            noiseSource.stop();
            noiseSource.disconnect();
        }

        let noiseBuffer = generateNoise(noiseType);
        noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = isMuted ? 0 : 0.5; // Handles mute state

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

        reverb = createSimpleReverb();

        noiseSource.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(filter3);
        filter3.connect(reverb);
        reverb.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        noiseSource.start();

        startMotionTracking();
    }).catch(error => console.error("AudioContext Resume Failed:", error));
}

// 🔹 Stop Audio
function stopAudio() {
    if (audioCtx) {
        audioCtx.suspend();
    }
}

// 🔹 Generate Noise Buffer
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
        } else if (type === "brown") {
            lastOut += 0.02 * white;
            lastOut = Math.max(-1, Math.min(1, lastOut));
            output[i] = lastOut * 0.3;
        }
    }

    return noiseBuffer;
}

// 🔹 Simple Reverb Effect (No Impulse Response)
function createSimpleReverb() {
    let delay = audioCtx.createDelay();
    delay.delayTime.value = 0.3;

    let feedback = audioCtx.createGain();
    feedback.gain.value = 0.5;

    let filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);

    let reverb = audioCtx.createGain();
    delay.connect(reverb);

    return reverb;
}

// 🔹 Motion-Controlled Sound Filters
function startMotionTracking() {
    window.removeEventListener("deviceorientation", updateSoundFilters);
    window.addEventListener("deviceorientation", updateSoundFilters);
}

function updateSoundFilters(event) {
    if (!filter1 || !filter2 || !filter3) return;

    let pitch = Math.abs(event.beta);
    let roll = Math.abs(event.gamma);

    // Apply smoothing
    let smoothFactor = 0.1;
    prevPitch += (pitch - prevPitch) * smoothFactor;
    prevRoll += (roll - prevRoll) * smoothFactor;

    filter1.frequency.value = 400 + prevPitch * 20;
    filter2.frequency.value = 800 + prevRoll * 10;
    filter3.frequency.value = 1600 - prevRoll * 5;

    filter1.Q.value = 5 + Math.abs(prevRoll / 10);
    filter2.Q.value = 5 + Math.abs(prevPitch / 10);
    filter3.Q.value = 5 + Math.abs((prevPitch + prevRoll) / 20);

    document.getElementById("pitch").textContent = filter1.frequency.value.toFixed(2);
    document.getElementById("volume").textContent = filter1.Q.value.toFixed(2);
}

// 🔹 Mute/Unmute Sound
document.getElementById("muteSound").addEventListener("click", () => {
    if (!gainNode) return;

    isMuted = !isMuted;
    gainNode.gain.value = isMuted ? 0 : 0.5;
    document.getElementById("muteSound").textContent = isMuted ? "Unmute Sound" : "Mute Sound";
});
