let mediaRecorder;
let recordedChunks = [];
let mixedStream;

window.onload = () => {
  // Ensure getStreamId and audio stream acquisition are run after DOM and resources are fully loaded
  document.getElementById("stopRecording").addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      updateStatus("Recording stopped.");
    }
  });

  // Start recording immediately on page load
  startRecording();
};

async function startRecording() {
  try {
    const streamId = await getStreamId();

    // Capture the screen video and system audio
    const desktopStream = await navigator.mediaDevices.getUserMedia({
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
    });

    // Validate if audio track exists
    if (!desktopStream.getAudioTracks().length) {
      console.warn("Desktop stream does not contain audio");
    }

    // Capture the microphone audio
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    // Validate if audio track exists
    if (!audioStream.getAudioTracks().length) {
      console.warn("Audio stream does not contain audio");
    }

    // Create an audio context and merge audio tracks
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    if (desktopStream.getAudioTracks().length) {
      const desktopAudio = audioContext.createMediaStreamSource(desktopStream);
      desktopAudio.connect(destination);
    }

    if (audioStream.getAudioTracks().length) {
      const micAudio = audioContext.createMediaStreamSource(audioStream);
      micAudio.connect(destination);
    }

    mixedStream = new MediaStream([
      ...desktopStream.getVideoTracks(),
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
