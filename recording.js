let mediaRecorder;
let recordedChunks = [];

window.onload = async () => {
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  console.log("Microphone access granted.", micStream);
  startRecording();

  document.getElementById("stopRecording").addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      updateStatus("Recording stopped.");
    }
  });
};

async function startRecording() {
  try {
    const streamId = await getStreamId();

    // Capture the screen video and system audio
    const desktopStream = await navigator.mediaDevices
      .getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: streamId
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: streamId
          }
        }
      })
      .catch((e) => {
        console.warn("Desktop audio not available:\n", e);
        return null;
      });

    // Capture the microphone audio
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Check and connect desktop audio source
    if (desktopStream && desktopStream.getAudioTracks().length) {
      const desktopAudio = audioContext.createMediaStreamSource(desktopStream);
      desktopAudio.connect(destination);
    }

    // Connect microphone audio source
    const micAudio = audioContext.createMediaStreamSource(audioStream);
    micAudio.connect(destination);

    // Create the mixed stream
    const mixedStream = new MediaStream([
      ...(desktopStream ? desktopStream.getVideoTracks() : []),
      ...destination.stream.getAudioTracks()
    ]);

    mediaRecorder = new MediaRecorder(mixedStream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      downloadRecording();
    };

    mediaRecorder.start();
    updateStatus("Recording...");
  } catch (err) {
    console.error("Error: ", err);
    updateStatus(`Error: ${err.message}`);
  }
}

function getStreamId() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getStreamId" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.streamId) {
        reject(new Error(response.error || "Failed to get stream ID"));
      } else {
        resolve(response.streamId);
      }
    });
  });
}

function downloadRecording() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "screen-recording.webm";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);

  // Close the tab after initiating the download
  setTimeout(() => closeCurrentTab(), 1000);
}

function closeCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.remove(tabs[0].id);
  });
}

function updateStatus(status) {
  document.getElementById("status").innerText = status;
}