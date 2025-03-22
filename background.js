chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "popup.html" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getStreamId") {
    chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window", "tab"],
      sender.tab,
      (streamId, ...others) => {
        if (streamId) {
          sendResponse({ streamId: streamId });
        } else {
          sendResponse({ error: "Failed to get stream ID", streamId, others, test: "Sample" });
        }
      }
    );
    return true;
  }

  if (message.action === "startRecording") {
    chrome.tabs.create({ url: chrome.runtime.getURL("recording-screen.html") }, (tab) => {
      sendResponse({ success: true });
    });
    return true;
  }
});
