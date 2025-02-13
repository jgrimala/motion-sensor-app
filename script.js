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

// 🔹 Start/Stop Sound
document.getElementById("toggleSound").addEventListener("click", () => {
    let selectedNoise = document.getElementById("noiseType").value;
    if (!audioCtx || audioCtx.state === "closed") {
        startAudio(selectedNoise);
        document.getElementById("toggleSound").textContent = "Stop Sound";
    } else {
        stopAudio();
        document.getElementById("toggleSound").textContent = "Start Sound";
    }
});

// 🔹 Start Audio
function startAudio(noiseType = "white") {
    if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    audioCtx.resume().then(() => {
        if (noiseSource) {
            noiseSource.stop();
            noiseSource.disconnect();
        }
        
        noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = generateTonalNoise(noiseType);
        noiseSource.loop = true;
        
        gainNode = audioCtx.createGain();
        gainNode.gain.value = isMuted ? 0 : 0.5;

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
    if (noiseSource) {
        noiseSource.stop();
        noiseSource.disconnect();
        noiseSource = null;
    }
    if (audioCtx) {
        audioCtx.suspend();
    }
    document.getElementById("toggleSound").textContent = "Start Sound";
}

// 🔹 Generate Tonal Noise Buffer
function generateTonalNoise(type = "white") {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let phase = 0;
    let frequency = 220; // Base frequency for tonal quality
    let sampleRate = audioCtx.sampleRate;

    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        let tone = Math.sin(2 * Math.PI * frequency * phase / sampleRate);
        phase++;

        output[i] = (white + tone) / 2; // Blend noise with sine wave
    }
    return noiseBuffer;
}

// 🔹 Mute/Unmute Sound
document.getElementById("muteSound").addEventListener("click", () => {
    if (!gainNode) return;
    isMuted = !isMuted;
    gainNode.gain.setTargetAtTime(isMuted ? 0 : 0.5, audioCtx.currentTime, 0.1);
    document.getElementById("muteSound").textContent = isMuted ? "Unmute Sound" : "Mute Sound";
});

// 🔹 Motion-Controlled Sound Filters
function startMotionTracking() {
    window.removeEventListener("deviceorientation", updateSoundFilters);
    window.addEventListener("deviceorientation", updateSoundFilters);
}

function updateSoundFilters(event) {
    if (!filter1 || !filter2 || !filter3) return;
    let pitch = Math.abs(event.beta);
    let roll = Math.abs(event.gamma);

    filter1.frequency.value = 400 + pitch * 20;
    filter2.frequency.value = 800 + roll * 10;
    filter3.frequency.value = 1600 - roll * 5;

    filter1.Q.value = 5 + Math.abs(roll / 10);
    filter2.Q.value = 5 + Math.abs(pitch / 10);
    filter3.Q.value = 5 + Math.abs((pitch + roll) / 20);

    document.getElementById("pitch").textContent = filter1.frequency.value.toFixed(2);
    document.getElementById("volume").textContent = filter1.Q.value.toFixed(2);
}
