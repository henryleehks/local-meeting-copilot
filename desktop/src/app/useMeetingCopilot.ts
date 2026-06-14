import { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingTypes,
  SourceConfidence,
  SpeakerConfidence,
  TranscriptSources,
  createTranscriptEvent
} from "../../../src/contracts.js";
import { generateDraftMinutes } from "../../../src/minutes-generator.js";
import { captureEventBus } from "../../capture-event-bus.js";
import { localMeetingStore } from "../../storage.js";
import { audioChunkMs, providerSeed } from "./constants";
import { getProviderApi, preferredAudioMimeType } from "./audio";

export function useMeetingCopilot() {
  const [activeTab, setActiveTab] = useState("home");
  const [meetingType, setMeetingType] = useState(MeetingTypes.founderCustomer);
  const [meeting, setMeeting] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [captureStatus, setCaptureStatus] = useState("Idle");
  const [runtimeVersion, setRuntimeVersion] = useState("Electron runtime ready");
  const [dbStatus, setDbStatus] = useState("Opening local database...");
  const [bridgeStatus, setBridgeStatus] = useState("Extension bridge listening on localhost.");
  const [eventBusStatus, setEventBusStatus] = useState("Bus ready");
  const [simulatorStatus, setSimulatorStatus] = useState("Use these controls to test the local event bus before real capture adapters exist.");
  const [question, setQuestion] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [suggestedAnswer, setSuggestedAnswer] = useState("No answer suggestion stored yet.");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [providers, setProviders] = useState<any>({
    google: { status: "Checking", detail: providerSeed.google.ready, events: [], busy: false, configured: false, connected: false },
    microsoft: { status: "Checking", detail: providerSeed.microsoft.ready, events: [], busy: false, configured: false, connected: false }
  });
  const [desktopCapture, setDesktopCapture] = useState<any>({
    status: "Not checked",
    help: "Refresh to detect candidate Zoom, Teams, and Meet/Chrome windows.",
    windows: [],
    selected: null
  });
  const [systemAudioFallback, setSystemAudioFallbackState] = useState(false);
  const [keepAudio, setKeepAudio] = useState(false);
  const [audioFallbackStatus, setAudioFallbackStatus] = useState("Fallback audio is off.");
  const meetingRef = useRef<any>(null);
  const liveSessionActiveRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const transcriptionQueueRef = useRef(Promise.resolve());
  const audioChunkIndexRef = useRef(0);
  const stopAudioCaptureRef = useRef<(() => void) | null>(null);

  const aiStatus = useMemo(() => suggestedAnswer && !suggestedAnswer.startsWith("No answer") ? "Ready" : "Optional", [suggestedAnswer]);
  const latestQuestion = meeting?.answerSuggestion?.triggerText || "No detected question yet.";
  const minutes = meeting?.minutes;
  const audioPolicyLabel = keepAudio ? "Keep for this meeting" : settings?.audioRetentionPolicy === "delete-after-processing" ? "Delete after processing" : "Keep meeting audio";

  function showFatalError(error: any) {
    setDbStatus(error?.message || "Local database failed.");
  }

  async function loadMeeting(nextMeetingType: string = meetingType) {
    setDbStatus("Loading local database...");
    const nextMeeting = await localMeetingStore.getMeetingBundleByType(nextMeetingType);
    if (!nextMeeting) throw new Error(`No local meeting found for type: ${nextMeetingType}`);
    setMeeting(nextMeeting);
    setMeetingType(nextMeeting.meetingType);
    setLiveSessionActive(false);
    setCaptureStatus("Idle");
    await window.desktopApp?.extensionBridge?.clearActiveSession();
    setDbStatus("IndexedDB ready; demo records loaded locally");
  }

  async function loadMeetingById(meetingId: string) {
    setDbStatus("Loading selected meeting...");
    const nextMeeting = await localMeetingStore.getMeetingBundle(meetingId);
    if (!nextMeeting) throw new Error(`No local meeting found for id: ${meetingId}`);
    setMeeting(nextMeeting);
    setMeetingType(nextMeeting.meetingType);
    setLiveSessionActive(false);
    setCaptureStatus("Idle");
    await window.desktopApp?.extensionBridge?.clearActiveSession();
    setDbStatus("Selected meeting loaded locally");
  }

  async function refreshProviderStatus(providerId: "google" | "microsoft") {
    const provider = providerSeed[providerId];
    const api = getProviderApi(providerId);
    if (!api) {
      setProviders((current: any) => ({ ...current, [providerId]: { ...current[providerId], status: "Unavailable", detail: `${provider.name} IPC is unavailable in this runtime.` } }));
      return;
    }

    const status = await api.status();
    let label = "Ready";
    let detail = provider.ready;
    if (!status.configured) {
      const missing = status.missingConfiguration?.length ? ` Missing: ${status.missingConfiguration.join(", ")}.` : "";
      label = "Not configured";
      detail = `${provider.notConfigured}${missing}`;
    } else if (status.connected) {
      label = "Connected";
      detail = provider.connected;
    }

    setProviders((current: any) => ({
      ...current,
      [providerId]: { ...current[providerId], status: label, detail, configured: status.configured, connected: status.connected }
    }));
  }

  async function syncCalendar(providerId: "google" | "microsoft") {
    const provider = providerSeed[providerId];
    const api = getProviderApi(providerId);
    setProviders((current: any) => ({ ...current, [providerId]: { ...current[providerId], status: "Syncing", detail: `Reading ${provider.name} events...`, busy: true } }));
    const events = await api.fetchUpcomingEvents();
    const meetings = events
      .map((event: any) => provider.normalize(event, { meetingType }))
      .filter((item: any) => item.joinUrl);
    const saved = [];
    for (const item of meetings) saved.push(await localMeetingStore.putMeetingBundle(item));
    setProviders((current: any) => ({
      ...current,
      [providerId]: {
        ...current[providerId],
        events: saved,
        status: "Synced",
        detail: `Imported ${saved.length} ${provider.name} meeting${saved.length === 1 ? "" : "s"} locally.`,
        busy: false
      }
    }));
    if (saved[0]) await loadMeetingById(saved[0].id);
  }

  async function connectProvider(providerId: "google" | "microsoft") {
    try {
      const provider = providerSeed[providerId];
      setProviders((current: any) => ({ ...current, [providerId]: { ...current[providerId], status: "Connecting", detail: `Opening ${provider.name} OAuth in your browser...`, busy: true } }));
      await getProviderApi(providerId).connect();
      await refreshProviderStatus(providerId);
      await syncCalendar(providerId);
    } catch (error: any) {
      setProviders((current: any) => ({ ...current, [providerId]: { ...current[providerId], status: "Connect failed", detail: error?.message || "Could not connect calendar.", busy: false } }));
    }
  }

  async function disconnectProvider(providerId: "google" | "microsoft") {
    try {
      await getProviderApi(providerId).disconnect();
      setProviders((current: any) => ({ ...current, [providerId]: { ...current[providerId], events: [] } }));
      await refreshProviderStatus(providerId);
    } catch (error: any) {
      setProviders((current: any) => ({ ...current, [providerId]: { ...current[providerId], status: "Disconnect failed", detail: error?.message || "Could not disconnect calendar." } }));
    }
  }

  async function startLiveAssist() {
    if (!meeting) return;
    setCaptureStatus("Live");
    setLiveSessionActive(true);
    await startAudioCapture();
    try {
      const result = await window.desktopApp?.extensionBridge?.setActiveSession({
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        platform: meeting.platform
      });
      setBridgeStatus(`Extension bridge bound to ${result.activeSession.meetingTitle}.`);
    } catch (error: any) {
      setBridgeStatus(error?.message || "Could not bind extension bridge to this meeting.");
    }
    setActiveTab("live");
  }

  async function stopCaptureAndDraftMinutes() {
    if (!meeting) return;
    setCaptureStatus("Stopped");
    stopAudioCapture();
    setLiveSessionActive(false);
    await window.desktopApp?.extensionBridge?.clearActiveSession();
    const draft = generateDraftMinutes(meeting);
    await localMeetingStore.putMeetingMinutes(draft);
    setMeeting(await localMeetingStore.getMeetingBundle(meeting.id));
    setActiveTab("minutes");
  }

  async function handleCaptureTranscriptEvent(event: any) {
    const currentMeeting = meetingRef.current;
    if (!liveSessionActiveRef.current || !currentMeeting || event.meetingId !== currentMeeting.id) return;
    await localMeetingStore.putTranscriptEvent(event);
    setMeeting(await localMeetingStore.getMeetingBundle(currentMeeting.id));
    setEventBusStatus("Event persisted");
    setSimulatorStatus(`Persisted ${event.source} event with ${event.speakerConfidence} speaker confidence and ${event.sourceConfidence} source confidence.`);
  }

  async function startAudioCapture() {
    stopAudioCapture();
    audioChunkIndexRef.current = 0;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setAudioFallbackStatus("This Electron runtime cannot record microphone audio.");
      return;
    }

    setAudioFallbackStatus("Requesting microphone access...");
    let transcriptionConfigured = false;
    try {
      const status = await window.desktopApp?.audioTranscription?.status();
      transcriptionConfigured = Boolean(status?.configured);
    } catch {
      transcriptionConfigured = false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
      const mimeType = preferredAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      stopAudioCaptureRef.current = () => stream.getTracks().forEach((track) => track.stop());

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) enqueueAudioChunk(event.data, transcriptionConfigured);
      });
      recorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
      });
      recorder.start(audioChunkMs);
      setSystemAudioFallbackState(true);
      setAudioFallbackStatus(transcriptionConfigured
        ? "Microphone capture is live; audio chunks are being transcribed into the local timeline."
        : "Microphone capture is live. Set OPENAI_API_KEY to transcribe captured audio chunks.");
    } catch (error: any) {
      setAudioFallbackStatus(error?.message || "Microphone capture could not start.");
    }
  }

  function stopAudioCapture() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stopAudioCaptureRef.current?.();
    mediaRecorderRef.current = null;
    audioStreamRef.current = null;
    stopAudioCaptureRef.current = null;
    setAudioFallbackStatus((current) => current.startsWith("Microphone capture")
      ? "Microphone capture stopped."
      : current);
  }

  function enqueueAudioChunk(blob: Blob, transcriptionConfigured: boolean) {
    if (!transcriptionConfigured) return;
    const chunkNumber = audioChunkIndexRef.current + 1;
    audioChunkIndexRef.current = chunkNumber;
    transcriptionQueueRef.current = transcriptionQueueRef.current
      .then(() => transcribeAudioChunk(blob, chunkNumber))
      .catch((error: any) => {
        setAudioFallbackStatus(error?.message || "Audio transcription failed.");
      });
  }

  async function transcribeAudioChunk(blob: Blob, chunkNumber: number) {
    const currentMeeting = meetingRef.current;
    if (!currentMeeting) return;

    setAudioFallbackStatus(`Transcribing microphone chunk ${chunkNumber}...`);
    const audio = Array.from(new Uint8Array(await blob.arrayBuffer()));
    const speakerNames = currentMeeting.participants
      .map((participant: any) => participant.displayName)
      .filter(Boolean);
    const result = await window.desktopApp.audioTranscription.transcribeChunk({
      audio,
      mimeType: blob.type || mediaRecorderRef.current?.mimeType || "audio/webm",
      speakerNames
    });
    const text = (result.text || result.rawText || "").trim();
    if (!text) {
      setAudioFallbackStatus(`Microphone chunk ${chunkNumber} contained no transcribable speech.`);
      return;
    }

    captureEventBus.emitTranscriptEvent(createTranscriptEvent({
      id: `audio-capture-${Date.now()}-${chunkNumber}`,
      meetingId: currentMeeting.id,
      timestamp: new Date().toISOString(),
      speakerName: "Captured audio",
      speakerConfidence: SpeakerConfidence.low,
      text,
      source: TranscriptSources.audioDiarization,
      sourceConfidence: SourceConfidence.medium
    }));
    setAudioFallbackStatus(keepAudio
      ? `Microphone chunk ${chunkNumber} transcribed; audio is retained for this meeting.`
      : `Microphone chunk ${chunkNumber} transcribed; raw audio was discarded after processing.`);
  }

  async function generateAnswer() {
    if (!meeting) return;
    setAnswerLoading(true);
    setSuggestedAnswer("Grounding answer in recent transcript, meeting metadata, participants, and private notes...");
    try {
      const answerSuggestion = await window.desktopApp.answerService.generate({
        meeting,
        question,
        notes: privateNotes
      });
      await localMeetingStore.putAnswerSuggestion(answerSuggestion);
      const nextMeeting = await localMeetingStore.getMeetingBundle(meeting.id);
      setMeeting(nextMeeting);
    } catch (error: any) {
      setSuggestedAnswer(error?.message || "Could not generate answer suggestion.");
    } finally {
      setAnswerLoading(false);
    }
  }

  async function refreshDesktopWindows() {
    setDesktopCapture((current: any) => ({ ...current, status: "Checking" }));
    const result = await window.desktopApp.desktopCapture.detectWindows();
    setDesktopCapture({
      status: result.ok ? "Ready" : "Needs permission",
      help: result.message,
      windows: result.windows || [],
      permissionHelp: result.permissionHelp,
      selected: null
    });
  }

  function confirmDesktopWindow() {
    if (!desktopCapture.selected) return;
    setDesktopCapture((current: any) => ({
      ...current,
      status: "Confirmed",
      help: `Selected ${current.selected.appName}: ${current.selected.title}. Capture still starts only after explicit user confirmation.`
    }));
  }

  function emitDesktopCaption(source: string) {
    if (!meeting || !desktopCapture.selected) return;
    const accessibility = source === TranscriptSources.desktopAccessibility;
    captureEventBus.emitTranscriptEvent(createTranscriptEvent({
      id: `desktop-${source}-${Date.now()}`,
      meetingId: meeting.id,
      timestamp: new Date().toISOString(),
      speakerName: accessibility ? "Desktop active speaker" : "Desktop speaker?",
      speakerConfidence: accessibility ? SpeakerConfidence.high : SpeakerConfidence.medium,
      text: accessibility
        ? `Accessibility caption from ${desktopCapture.selected.title}.`
        : `OCR fallback caption read from ${desktopCapture.selected.title}.`,
      source,
      sourceConfidence: accessibility ? SourceConfidence.high : SourceConfidence.medium
    }));
  }

  function processAudioFallback() {
    if (!meeting || !systemAudioFallback) {
      setAudioFallbackStatus("Start Live Assist to enable microphone capture first.");
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.requestData();
      setAudioFallbackStatus("Queued the current microphone buffer for transcription.");
      return;
    }

    setAudioFallbackStatus("No active microphone buffer is available to process.");
  }

  function setSystemAudioFallback(value: boolean) {
    setSystemAudioFallbackState(value);
    setAudioFallbackStatus(value ? "Fallback system audio enabled for this session. It will be processed only after explicit action." : "Fallback audio is off.");
  }

  function setMeetingTypeFromPicker(value: string) {
    loadMeeting(value).catch(showFatalError);
  }

  function syncCalendarFromSettings(id: "google" | "microsoft") {
    syncCalendar(id).catch((error: any) => {
      setProviders((current: any) => ({ ...current, [id]: { ...current[id], status: "Sync failed", detail: error?.message || "Could not sync calendar.", busy: false } }));
    });
  }

  function loadMeetingByIdFromSettings(id: string) {
    loadMeetingById(id).catch(showFatalError);
  }

  useEffect(() => {
    meetingRef.current = meeting;
  }, [meeting]);

  useEffect(() => {
    liveSessionActiveRef.current = liveSessionActive;
  }, [liveSessionActive]);

  useEffect(() => {
    localMeetingStore.init()
      .then(async () => {
        setSettings(await localMeetingStore.getSetting("privacy-defaults"));
        await loadMeeting();
        await Promise.all([refreshProviderStatus("google"), refreshProviderStatus("microsoft")]);
      })
      .catch(showFatalError);

    window.desktopApp?.getVersion().then((version: string) => setRuntimeVersion(`Electron app v${version}`));
    window.desktopApp?.extensionBridge?.status().then((status: any) => {
      setBridgeStatus(status.activeSession ? `Extension bridge bound to ${status.activeSession.meetingTitle}.` : `Extension bridge listening at http://127.0.0.1:${status.port}.`);
    });

    const offStatus = window.desktopApp?.extensionBridge?.onStatus((status: any) => {
      setBridgeStatus(status.activeSession ? `Chrome extension checked in; active session is ${status.activeSession.meetingTitle}.` : "Chrome extension checked in; no active Live Assist session yet.");
    });
    const offExtension = window.desktopApp?.extensionBridge?.onTranscriptEvent((event: any) => {
      try {
        captureEventBus.emitTranscriptEvent(event);
        setEventBusStatus("Extension event received");
      } catch (error: any) {
        setEventBusStatus("Extension event rejected");
        setSimulatorStatus(error?.message || "Invalid extension transcript event.");
      }
    });
    const offBus = captureEventBus.onTranscriptEvent((event: any) => {
      handleCaptureTranscriptEvent(event).catch((error: any) => {
        setEventBusStatus("Persist failed");
        setSimulatorStatus(error?.message || "Could not persist transcript event.");
      });
    });

    return () => {
      stopAudioCapture();
      offStatus?.();
      offExtension?.();
      offBus?.();
    };
  }, []);

  useEffect(() => {
    if (!meeting) return;
    setQuestion(meeting.answerSuggestion?.triggerText || "");
    setSuggestedAnswer(meeting.answerSuggestion?.suggestedAnswer || "No answer suggestion stored yet.");
    setKeepAudio(meeting.audioRetentionPolicy !== "delete-after-processing");
  }, [meeting?.id, meeting?.answerSuggestion?.id]);

  return {
    activeTab,
    setActiveTab,
    meetingType,
    meeting,
    liveSessionActive,
    captureStatus,
    runtimeVersion,
    dbStatus,
    bridgeStatus,
    eventBusStatus,
    simulatorStatus,
    question,
    setQuestion,
    privateNotes,
    setPrivateNotes,
    suggestedAnswer,
    answerLoading,
    providers,
    desktopCapture,
    setDesktopCapture,
    systemAudioFallback,
    setSystemAudioFallback,
    keepAudio,
    setKeepAudio,
    audioFallbackStatus,
    aiStatus,
    latestQuestion,
    minutes,
    audioPolicyLabel,
    setMeetingTypeFromPicker,
    startLiveAssist,
    stopCaptureAndDraftMinutes,
    generateAnswer,
    connectProvider,
    disconnectProvider,
    syncCalendarFromSettings,
    loadMeetingByIdFromSettings,
    refreshDesktopWindows,
    confirmDesktopWindow,
    emitDesktopCaption,
    processAudioFallback
  };
}
