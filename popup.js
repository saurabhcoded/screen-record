let mediaRecorder;
let recordedChunks = [];
let stream;

document.getElementById("startRecording").addEventListener("click", startRecording);
document.getElementById("stopRecording").addEventListener("click", stopRecording);

async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: "screen" },
      audio: true // This will capture system audio if available
    });

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      downloadRecording();
    };

    mediaRecorder.start();
    updateUI(true);
  } catch (err) {
    console.error("Error: " + err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    updateUI(false);
  }
}

function downloadRecording() {
  const blob = new Blob(recordedChunks, {
    type: "video/webm"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "screen-recording.webm";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  recordedChunks = [];
}

function updateUI(isRecording) {
  document.getElementById("startRecording").disabled = isRecording;
  document.getElementById("stopRecording").disabled = !isRecording;
  document.getElementById("recordingStatus").textContent = isRecording
    ? "Recording..."
    : "Not recording";
}

// Initialize UI
updateUI(false);

function stopRecording() {
  mediaRecorder.stop();
  document.getElementById("startRecording").disabled = false;
  document.getElementById("stopRecording").disabled = true;
  stream.getTracks().forEach((track) => track.stop());
  updateUI(false);
}
