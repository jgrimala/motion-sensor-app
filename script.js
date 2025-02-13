let audioCtx;
let noiseSource = null;
let gainNode;
let filter1, filter2, filter3;
let reverb;
let motionTracking = false;
let osc1, osc2;
// ✅ Manually set the version (NO auto-incrementation)
// document.title = "Motion-Sensor App v1.6";
// document.getElementById("appHeader").textContent = "Motion-Sensor App v1.6";

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
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // ✅ Ensure AudioContext is resumed (iOS Fix)
    audioCtx.resume().then(() => {
        if (!noiseSource) {
            startAudio(selectedNoise);
            document.getElementById("toggleSound").textContent = "Stop Sound";
        } else {
            stopAudio();
            document.getElementById("toggleSound").textContent = "Start Sound";
        }
    }).catch(error => console.error("AudioContext Resume Failed:", error));
});


// 🔹 Start Audio
function startAudio(noiseType = "white") {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioCtx.resume().then(() => {
        if (noiseSource) {
            noiseSource.stop();
            noiseSource.disconnect();
        }

        // 🎵 Use global variables for oscillators
        osc1 = audioCtx.createOscillator();
        osc2 = audioCtx.createOscillator();

        osc1.type = "sawtooth";  // More harmonics than sine
        osc2.type = "sawtooth";

        osc1.frequency.value = 220;
        osc2.frequency.value = 330; 

        let oscGain = audioCtx.createGain();
        oscGain.gain.value = 0.3;

        osc1.connect(oscGain);
        osc2.connect(oscGain);

        let noiseBuffer = generateNoise(noiseType);
        noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.5;

        filter1 = audioCtx.createBiquadFilter();
        filter1.type = "bandpass";
        filter1.frequency.value = 400;
        filter1.Q.value = 30;

        filter2 = audioCtx.createBiquadFilter();
        filter2.type = "bandpass";
        filter2.frequency.value = 700;
        filter2.Q.value = 25;

        filter3 = audioCtx.createBiquadFilter();
        filter3.type = "bandpass";
        filter3.frequency.value = 1000;
        filter3.Q.value = 20;

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
        audioCtx.close();
        audioCtx = null;
    }

    window.removeEventListener("deviceorientation", updateSoundFilters);
}

// 🔹 Generate Noise
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

// 🔹 Create Simple Reverb
function createSimpleReverb() {
    let delay = audioCtx.createDelay();
    delay.delayTime.value = 0.3; // Short delay for a reverb-like effect

    let feedback = audioCtx.createGain();
    feedback.gain.value = 0.5; // Controls the "wetness" of the reverb

    let filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000; // Cuts off high frequencies for a smoother sound

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);

    let reverb = audioCtx.createGain();
    delay.connect(reverb);

    return reverb;
}

// 🔹 Motion-Controlled Sound Filters
function startMotionTracking() {
    console.log("Motion tracking started");

    // Remove any previous listener to avoid duplicates
    window.removeEventListener("deviceorientation", updateSoundFilters);

    // Add listener to track motion sensor input
    window.addEventListener("deviceorientation", updateSoundFilters);
}

function updateSoundFilters(event) {
    if (!filter1 || !filter2 || !filter3 || !osc1 || !osc2) return;

    let pitch = Math.abs(event.beta);  
    let roll = Math.abs(event.gamma);  

    // ✅ Ensure oscillators update dynamically with motion
    let baseFrequency = 220 + pitch * 2;  
    let harmonicFrequency = baseFrequency * 1.5;  

    osc1.frequency.value = baseFrequency;
    osc2.frequency.value = harmonicFrequency;

    // ✅ Adjust Bandpass Filter Frequencies
    filter1.frequency.value = 400 + pitch * 20;
    filter2.frequency.value = 700 + roll * 10;
    filter3.frequency.value = 1000 - roll * 5;

    // ✅ Adjust Resonance (Q Factor)
    filter1.Q.value = 30 + Math.abs(roll / 10);
    filter2.Q.value = 25 + Math.abs(pitch / 10);
    filter3.Q.value = 20 + Math.abs((pitch + roll) / 20);

    // ✅ Update UI
    document.getElementById("pitch").textContent = osc1.frequency.value.toFixed(2);
    document.getElementById("volume").textContent = filter1.Q.value.toFixed(2);
}
