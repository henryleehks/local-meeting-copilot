const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const state = {
  source: "mic",
  stream: null,
  recorder: null,
  chunks: [],
  recognition: null,
  recording: false,
  startedAt: 0,
  timerId: null,
  speakers: ["You", "Guest"]
};

const els = {
  meetingTitle: document.querySelector("#meetingTitle"),
  meetingHeading: document.querySelector("#meetingHeading"),
  recordBtn: document.querySelector("#recordBtn"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),
  timer: document.querySelector("#timer"),
  transcript: document.querySelector("#transcript"),
  interim: document.querySelector("#interim"),
  answerBtn: document.querySelector("#answerBtn"),
  answerOutput: document.querySelector("#answerOutput"),
  questionInput: document.querySelector("#questionInput"),
  notesInput: document.querySelector("#notesInput"),
  speakerList: document.querySelector("#speakerList"),
  activeSpeaker: document.querySelector("#activeSpeaker"),
  addSpeakerBtn: document.querySelector("#addSpeakerBtn"),
  downloadBtn: document.querySelector("#downloadBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  transcribeRecordingBtn: document.querySelector("#transcribeRecordingBtn"),
  minutesBtn: document.querySelector("#minutesBtn"),
  minutesOutput: document.querySelector("#minutesOutput"),
  sourceButtons: document.querySelectorAll("[data-source]"),
  modelBadge: document.querySelector("#modelBadge")
};

function setStatus(text, live = false) {
  els.statusText.textContent = text;
  els.statusDot.classList.toggle("live", live);
}

function getActiveSpeaker() {
  return els.activeSpeaker.value || state.speakers[0] || "Speaker";
}

function renderSpeakers() {
  els.speakerList.textContent = "";
  els.activeSpeaker.textContent = "";

  state.speakers.forEach((speaker, index) => {
    const row = document.createElement("div");
    row.className = "speaker-row";

    const input = document.createElement("input");
    input.value = speaker;
    input.setAttribute("aria-label", `Speaker ${index + 1} name`);
    input.addEventListener("input", () => {
      state.speakers[index] = input.value.trim() || `Speaker ${index + 1}`;
      renderSpeakerOptions();
      saveLocal();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "x";
    remove.title = "Remove speaker";
    remove.addEventListener("click", () => {
      if (state.speakers.length === 1) return;
      state.speakers.splice(index, 1);
      renderSpeakers();
      saveLocal();
    });

    row.append(input, remove);
    els.speakerList.append(row);
  });

  renderSpeakerOptions();
}

function renderSpeakerOptions() {
  const selected = els.activeSpeaker.value || state.speakers[0];
  els.activeSpeaker.textContent = "";
  state.speakers.forEach((speaker) => {
    const option = document.createElement("option");
    option.value = speaker;
    option.textContent = speaker;
    els.activeSpeaker.append(option);
  });
  if (state.speakers.includes(selected)) els.activeSpeaker.value = selected;
}

function appendTranscript(text, label = getActiveSpeaker()) {
  const clean = text.trim();
  if (!clean) return;
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const prefix = `[${stamp}] ${label}: `;
  els.transcript.textContent = `${els.transcript.textContent}${els.transcript.textContent ? "\n\n" : ""}${prefix}${clean}`;
  els.transcript.scrollTop = els.transcript.scrollHeight;
  saveLocal();
}

function getTranscriptText() {
  const notes = els.notesInput.value.trim();
  const transcript = els.transcript.textContent.trim();
  return notes ? `${transcript}\n\nPrivate notes:\n${notes}` : transcript;
}

function getSpeakerNames() {
  return state.speakers.map((speaker) => speaker.trim()).filter(Boolean);
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startTimer() {
  state.startedAt = Date.now();
  state.timerId = setInterval(() => {
    els.timer.textContent = formatTime(Date.now() - state.startedAt);
  }, 250);
}

function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
}

async function getMeetingStream() {
  if (state.source === "screen") {
    return await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  }
  return await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  });
}

function setupSpeechRecognition() {
  if (!SpeechRecognition) {
    setStatus("Recording; browser live transcription unavailable", true);
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0]?.transcript || "";
      if (result.isFinal) appendTranscript(text);
      else interim += text;
    }
    els.interim.textContent = interim ? `${getActiveSpeaker()}: ${interim}` : "";
  };

  recognition.onerror = (event) => {
    setStatus(`Speech recognition: ${event.error}`, state.recording);
  };

  recognition.onend = () => {
    if (state.recording) {
      try {
        recognition.start();
      } catch {
        setStatus("Recording; transcript paused", true);
      }
    }
  };

  recognition.start();
  return recognition;
}

async function startRecording() {
  state.stream = await getMeetingStream();
  state.chunks = [];
  state.recorder = new MediaRecorder(state.stream, { mimeType: "audio/webm" });
  state.recorder.ondataavailable = (event) => {
    if (event.data.size) state.chunks.push(event.data);
  };
  state.recorder.start(1000);
  state.recognition = setupSpeechRecognition();
  state.recording = true;
  els.recordBtn.classList.add("recording");
  els.recordBtn.innerHTML = '<span class="record-dot"></span>Stop listening';
  setStatus("Live", true);
  startTimer();
}

function stopRecording() {
  state.recording = false;
  state.recorder?.stop();
  state.recognition?.stop();
  state.stream?.getTracks().forEach((track) => track.stop());
  state.recorder = null;
  state.recognition = null;
  state.stream = null;
  els.recordBtn.classList.remove("recording");
  els.recordBtn.innerHTML = '<span class="record-dot"></span>Start listening';
  els.interim.textContent = "";
  setStatus("Stopped; ready for diarization or minutes");
  stopTimer();
}

async function toggleRecording() {
  try {
    if (state.recording) stopRecording();
    else await startRecording();
  } catch (error) {
    setStatus(error.message || "Could not start recording");
  }
}

async function generateAnswer() {
  els.answerBtn.disabled = true;
  els.answerOutput.textContent = "Thinking...";

  try {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingTitle: els.meetingTitle.value,
        transcript: getTranscriptText(),
        question: els.questionInput.value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Answer request failed.");
    els.answerOutput.textContent = data.answer;
    els.modelBadge.textContent = data.model;
  } catch (error) {
    els.answerOutput.textContent = error.message;
  } finally {
    els.answerBtn.disabled = false;
  }
}

async function transcribeRecording() {
  if (!state.chunks.length) {
    setStatus("No recording captured yet");
    return;
  }

  els.transcribeRecordingBtn.disabled = true;
  setStatus("Transcribing recording...");

  try {
    const blob = new Blob(state.chunks, { type: "audio/webm" });
    const speakers = encodeURIComponent(getSpeakerNames().join(","));
    const response = await fetch(`/api/transcribe?speakers=${speakers}`, {
      method: "POST",
      headers: { "content-type": "audio/webm" },
      body: blob
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Transcription failed.");
    if (data.text) {
      els.transcript.textContent = data.text;
      saveLocal();
    }
    setStatus(`Transcribed with ${data.model}`);
  } catch (error) {
    setStatus(error.message);
  } finally {
    els.transcribeRecordingBtn.disabled = false;
  }
}

async function generateMinutes() {
  els.minutesBtn.disabled = true;
  els.minutesOutput.textContent = "Consolidating meeting notes...";

  try {
    const response = await fetch("/api/minutes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingTitle: els.meetingTitle.value,
        transcript: els.transcript.textContent,
        notes: els.notesInput.value,
        speakerNames: getSpeakerNames()
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Minutes request failed.");
    els.minutesOutput.textContent = data.minutes;
    els.modelBadge.textContent = data.model;
  } catch (error) {
    els.minutesOutput.textContent = error.message;
  } finally {
    els.minutesBtn.disabled = false;
  }
}

function downloadTranscript() {
  const content = [
    els.meetingTitle.value,
    new Date().toLocaleString(),
    "",
    els.transcript.textContent.trim(),
    "",
    "Private notes:",
    els.notesInput.value.trim()
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${els.meetingTitle.value || "meeting"}-transcript.txt`.replace(/[^\w.-]+/g, "-");
  anchor.click();
  URL.revokeObjectURL(url);
}

function saveLocal() {
  localStorage.setItem("meeting-copilot-state", JSON.stringify({
    title: els.meetingTitle.value,
    transcript: els.transcript.textContent,
    notes: els.notesInput.value,
    speakers: state.speakers,
    activeSpeaker: els.activeSpeaker.value,
    minutes: els.minutesOutput.textContent
  }));
}

function restoreLocal() {
  const raw = localStorage.getItem("meeting-copilot-state");
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    els.meetingTitle.value = saved.title || els.meetingTitle.value;
    state.speakers = Array.isArray(saved.speakers) && saved.speakers.length ? saved.speakers : state.speakers;
    renderSpeakers();
    if (saved.activeSpeaker && state.speakers.includes(saved.activeSpeaker)) {
      els.activeSpeaker.value = saved.activeSpeaker;
    }
    els.meetingHeading.textContent = els.meetingTitle.value;
    els.transcript.textContent = saved.transcript || "";
    els.notesInput.value = saved.notes || "";
    els.minutesOutput.textContent = saved.minutes || els.minutesOutput.textContent;
  } catch {
    localStorage.removeItem("meeting-copilot-state");
  }
}

els.recordBtn.addEventListener("click", toggleRecording);
els.answerBtn.addEventListener("click", generateAnswer);
els.minutesBtn.addEventListener("click", generateMinutes);
els.downloadBtn.addEventListener("click", downloadTranscript);
els.transcribeRecordingBtn.addEventListener("click", transcribeRecording);
els.addSpeakerBtn.addEventListener("click", () => {
  state.speakers.push(`Speaker ${state.speakers.length + 1}`);
  renderSpeakers();
  saveLocal();
});
els.clearBtn.addEventListener("click", () => {
  els.transcript.textContent = "";
  els.questionInput.value = "";
  els.answerOutput.textContent = "Your answer will appear here.";
  els.minutesOutput.textContent = "End the meeting, then generate a summary, decisions, action items, and follow-up draft.";
  els.notesInput.value = "";
  state.speakers = ["You", "Guest"];
  renderSpeakers();
  localStorage.removeItem("meeting-copilot-state");
});

els.meetingTitle.addEventListener("input", () => {
  els.meetingHeading.textContent = els.meetingTitle.value || "Untitled meeting";
  saveLocal();
});
els.transcript.addEventListener("input", saveLocal);
els.notesInput.addEventListener("input", saveLocal);
els.activeSpeaker.addEventListener("change", saveLocal);

els.sourceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.source = button.dataset.source;
    els.sourceButtons.forEach((item) => item.classList.toggle("active", item === button));
  });
});

renderSpeakers();
restoreLocal();
if (!SpeechRecognition) {
  els.interim.textContent = "Tip: Chrome gives the best browser live transcription support. Recording still works elsewhere.";
}
