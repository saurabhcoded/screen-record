// popup.js

let mediaRecorder;
let recordedChunks = [];

document.getElementById("startRecording").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "startRecording" }, (response) => {
    if (!response.success) {
      console.error("Failed to open recording tab");
    }
  });
});


async function startRecording() {
  try {
    const streamId = await getStreamId();
    const stream = await navigator.mediaDevices.getUserMedia({
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
    console.error("Error:", err);
    updateUI(false);
  }
}

function getStreamId() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getStreamId" }, (response) => {
      console.log("response:getStreamId", response);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.streamId) {
        resolve(response.streamId);
      } else {
        reject(new Error(response.error || "Failed to get stream ID"));
      }
    });
  });
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
}

function updateUI(isRecording) {
  document.getElementById("startRecording").disabled = isRecording;
}

// Initialize UI
updateUI(false);
