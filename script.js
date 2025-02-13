let audioCtx;
let noiseSource = null; // globally defined
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
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // ✅ Resume audio first before starting playback
    audioCtx.resume().then(() => {
        // ✅ Ensure old noise source is removed before creating a new one
        if (noiseSource) {
            noiseSource.stop();
            noiseSource.disconnect();
        }

        let noiseBuffer = generateNoise(noiseType);
        noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.5; // ✅ Ensure sound is not muted

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

        // ✅ Change reverb type (Simple Reverb Instead of Impulse Response)
        reverb = createSimpleReverb();

        // ✅ Connect nodes properly
        noiseSource.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(filter3);
        filter3.connect(reverb);
        reverb.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        noiseSource.start();

        // ✅ Start motion tracking when sound starts
        startMotionTracking();
    }).catch(error => console.error("AudioContext Resume Failed:", error));
}




// 🔹 Stop Audio
function stopAudio() {
    if (noiseSource) {
        noiseSource.stop();
        noiseSource.disconnect();
        noiseSource = null;  // Ensure noise source is properly reset
    }

    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }

    // ✅ Remove motion tracking when stopping
    window.removeEventListener("deviceorientation", updateSoundFilters);
}




// 🔹 Reset Sound Filter Parameters
function resetFilters() {
    if (filter1) filter1.frequency.value = 400;
    if (filter2) filter2.frequency.value = 800;
    if (filter3) filter3.frequency.value = 1600;

    document.getElementById("pitch").textContent = "400";
    document.getElementById("volume").textContent = "5";
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
            lastOut = Math.max(-1, Math.min(1, lastOut));  // Prevent excessive drift
            output[i] = lastOut * 0.3;
        }
    }

    return noiseBuffer;
}



// 🔹 Load Reverb Impulse / commented for test with a simple delay effect reverb
// function loadReverbImpulse(convolver) {
//     fetch("https://cdn.freesound.org/reverb-impulse-response.wav")
//         .then(response => response.arrayBuffer())
//         .then(data => audioCtx.decodeAudioData(data, buffer => {
//             convolver.buffer = buffer;
//         }))
//         .catch(error => console.error("Reverb loading failed:", error));

//     // Set a basic impulse response while loading
//     const fakeBuffer = audioCtx.createBuffer(2, 1, audioCtx.sampleRate);
//     convolver.buffer = fakeBuffer;
// }

function createSimpleReverb() {
    let delay = audioCtx.createDelay();
    delay.delayTime.value = 0.3; // Short delay for reverb effect

    let feedback = audioCtx.createGain();
    feedback.gain.value = 0.5; // Adjust for more/less reverb

    let filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000; // Filter out high frequencies in reverb

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

    let pitch = Math.abs(event.beta);  // Forward/Backward tilt
    let roll = Math.abs(event.gamma);  // Side tilt

    // ✅ Adjust Bandpass Filter Frequencies
    filter1.frequency.value = 400 + pitch * 20;
    filter2.frequency.value = 800 + roll * 10;
    filter3.frequency.value = 1600 - roll * 5;

    // ✅ Adjust Bandwidth (Q Factor) - Now updates!
    filter1.Q.value = 5 + Math.abs(roll / 10);
    filter2.Q.value = 5 + Math.abs(pitch / 10);
    filter3.Q.value = 5 + Math.abs((pitch + roll) / 20);

    // ✅ Update UI
    document.getElementById("pitch").textContent = filter1.frequency.value.toFixed(2);
    document.getElementById("volume").textContent = filter1.Q.value.toFixed(2);
}


