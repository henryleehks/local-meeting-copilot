import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Tabs from "@radix-ui/react-tabs";
import {
  AudioLines,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Laptop,
  Lock,
  MessageSquareText,
  Mic,
  Plug,
  Radar,
  ShieldCheck,
  Sparkles,
  Square,
  WandSparkles
} from "lucide-react";
import { clsx } from "clsx";
import {
  MeetingTypes,
  SpeakerConfidence,
  SourceConfidence,
  TranscriptSources,
  createTranscriptEvent,
  validateTranscriptEvent
} from "../../src/contracts.js";
import {
  normalizeGoogleCalendarEvent,
  normalizeMicrosoftCalendarEvent
} from "../../src/calendar-normalizer.js";
import { generateDraftMinutes } from "../../src/minutes-generator.js";
import { captureEventBus } from "../capture-event-bus.js";
import { createSimulatedCaptureEvent, simulatorSources } from "../capture-simulator.js";
import { localMeetingStore } from "../storage.js";

const tabs = [
  { id: "home", label: "Home", icon: CalendarDays },
  { id: "live", label: "Live", icon: MessageSquareText },
  { id: "minutes", label: "Minutes", icon: FileText },
  { id: "settings", label: "Settings", icon: ShieldCheck }
];

const providerSeed = {
  google: {
    name: "Google Calendar",
    normalize: normalizeGoogleCalendarEvent,
    notConfigured: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the desktop app.",
    ready: "Connect Google Calendar to read current and upcoming external calls.",
    connected: "Sync reads current and upcoming Google Calendar events, then stores normalized meetings locally."
  },
  microsoft: {
    name: "Microsoft Calendar",
    normalize: normalizeMicrosoftCalendarEvent,
    notConfigured: "Set MICROSOFT_CLIENT_ID, then restart the desktop app.",
    ready: "Connect Microsoft Calendar to read Outlook and Teams meetings.",
    connected: "Sync reads current and upcoming Microsoft Calendar events, then stores normalized meetings locally."
  }
};

function Button({ variant = "secondary", className, ...props }: any) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-lime-300 text-black shadow-[0_0_36px_rgba(190,242,100,.22)] hover:bg-lime-200",
        variant === "danger" && "bg-white/10 text-white ring-1 ring-white/12 hover:bg-white/15",
        variant === "ghost" && "bg-transparent text-zinc-300 hover:bg-white/8 hover:text-white",
        variant === "secondary" && "bg-white/8 text-zinc-100 ring-1 ring-white/10 hover:bg-white/12",
        className
      )}
    />
  );
}

function Badge({ children, tone = "neutral" }: any) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1",
        tone === "live" && "bg-lime-300/12 text-lime-200 ring-lime-300/25",
        tone === "warn" && "bg-amber-400/12 text-amber-200 ring-amber-300/25",
        tone === "neutral" && "bg-white/7 text-zinc-300 ring-white/10"
      )}
    >
      {children}
    </span>
  );
}

function Panel({ className, children }: any) {
  return <section className={clsx("rounded-2xl border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur", className)}>{children}</section>;
}

function Eyebrow({ children }: any) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-normal text-zinc-500">{children}</p>;
}

function meetingTypeLabel(meetingType: string) {
  return meetingType === MeetingTypes.founderCustomer ? "Founder/customer" : "Candidate prep/mock";
}

function confidenceLabel(confidence: string) {
  return confidence === SpeakerConfidence.medium ? "Medium confidence" : `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatStructuredItem(item: any) {
  const owner = item.owner ? `${item.owner}: ` : "";
  const dueDate = item.dueDate ? ` (${item.dueDate})` : "";
  return `${owner}${item.text}${dueDate}`;
}

function getProviderApi(id: string) {
  return id === "google" ? window.desktopApp?.googleCalendar : window.desktopApp?.microsoftCalendar;
}

export function App() {
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
  const [systemAudioFallback, setSystemAudioFallback] = useState(false);
  const [keepAudio, setKeepAudio] = useState(false);
  const [audioFallbackStatus, setAudioFallbackStatus] = useState("Fallback audio is off.");
  const meetingRef = useRef<any>(null);
  const liveSessionActiveRef = useRef(false);

  const aiStatus = useMemo(() => suggestedAnswer && !suggestedAnswer.startsWith("No answer") ? "Ready" : "Optional", [suggestedAnswer]);
  const latestQuestion = meeting?.answerSuggestion?.triggerText || "No detected question yet.";
  const transcriptEvents = meeting?.transcriptEvents || [];
  const minutes = meeting?.minutes;

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
      setAudioFallbackStatus("Enable fallback system audio before processing.");
      return;
    }

    const mappedParticipant = meeting.participants.find((participant: any) => participant.role !== "user" && participant.role !== "candidate");
    captureEventBus.emitTranscriptEvent(createTranscriptEvent({
      id: `audio-diarization-${Date.now()}`,
      meetingId: meeting.id,
      timestamp: new Date().toISOString(),
      speakerName: mappedParticipant ? `${mappedParticipant.displayName}?` : "Speaker 2",
      speakerId: mappedParticipant?.id,
      speakerConfidence: mappedParticipant ? SpeakerConfidence.medium : SpeakerConfidence.low,
      text: "Diarized fallback transcript generated from system audio after caption and OCR paths were unavailable.",
      source: TranscriptSources.audioDiarization,
      sourceConfidence: SourceConfidence.low
    }));
    setAudioFallbackStatus(keepAudio
      ? "Fallback transcript merged. Audio marked to keep for this meeting."
      : "Fallback transcript merged. Captured audio deleted after processing by default.");
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

  const renderContent = () => {
    if (activeTab === "home") {
      return (
        <HomeView
          meeting={meeting}
          providers={providers}
          captureStatus={captureStatus}
          dbStatus={dbStatus}
          aiStatus={aiStatus}
          bridgeStatus={bridgeStatus}
          meetingType={meetingType}
          setMeetingType={(value: string) => loadMeeting(value).catch(showFatalError)}
          startLiveAssist={startLiveAssist}
          setActiveTab={setActiveTab}
        />
      );
    }
    if (activeTab === "live") {
      return (
        <LiveView
          meeting={meeting}
          captureStatus={captureStatus}
          latestQuestion={latestQuestion}
          question={question}
          setQuestion={setQuestion}
          privateNotes={privateNotes}
          setPrivateNotes={setPrivateNotes}
          suggestedAnswer={suggestedAnswer}
          answerLoading={answerLoading}
          generateAnswer={generateAnswer}
          stopCaptureAndDraftMinutes={stopCaptureAndDraftMinutes}
          eventBusStatus={eventBusStatus}
          bridgeStatus={bridgeStatus}
          simulatorStatus={simulatorStatus}
        />
      );
    }
    if (activeTab === "minutes") return <MinutesView meeting={meeting} minutes={minutes} />;
    return (
      <SettingsView
        providers={providers}
        connectProvider={connectProvider}
        disconnectProvider={disconnectProvider}
        syncCalendar={(id: any) => syncCalendar(id).catch((error: any) => {
          setProviders((current: any) => ({ ...current, [id]: { ...current[id], status: "Sync failed", detail: error?.message || "Could not sync calendar.", busy: false } }));
        })}
        loadMeetingById={(id: string) => loadMeetingById(id).catch(showFatalError)}
        desktopCapture={desktopCapture}
        refreshDesktopWindows={refreshDesktopWindows}
        setDesktopCapture={setDesktopCapture}
        confirmDesktopWindow={confirmDesktopWindow}
        emitDesktopCaption={emitDesktopCaption}
        systemAudioFallback={systemAudioFallback}
        setSystemAudioFallback={(value: boolean) => {
          setSystemAudioFallback(value);
          setAudioFallbackStatus(value ? "Fallback system audio enabled for this session. It will be processed only after explicit action." : "Fallback audio is off.");
        }}
        keepAudio={keepAudio}
        setKeepAudio={setKeepAudio}
        processAudioFallback={processAudioFallback}
        audioFallbackStatus={audioFallbackStatus}
        audioPolicyLabel={keepAudio ? "Keep for this meeting" : settings?.audioRetentionPolicy === "delete-after-processing" ? "Delete after processing" : "Keep meeting audio"}
      />
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(190,242,100,.13),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,.08),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-4 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-lime-300 text-black shadow-[0_0_40px_rgba(190,242,100,.25)]">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Meeting Copilot</div>
              <div className="text-xs text-zinc-500">{runtimeVersion}</div>
            </div>
          </div>
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <Tabs.List className="flex rounded-xl bg-white/6 p-1 ring-1 ring-white/10" aria-label="Primary">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Tabs.Trigger
                    key={tab.id}
                    value={tab.id}
                    className={clsx(
                      "flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition",
                      activeTab === tab.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>
          </Tabs.Root>
          <div className="flex items-center gap-2">
            <Badge tone={liveSessionActive ? "live" : "neutral"}>{liveSessionActive ? "Live" : "Capture off"}</Badge>
            <Badge tone="neutral">Local-first</Badge>
          </div>
        </header>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-4 md:hidden">
          <Tabs.List className="flex rounded-xl bg-white/6 p-1 ring-1 ring-white/10" aria-label="Primary">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={clsx("flex flex-1 items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold", activeTab === tab.id ? "bg-white text-black" : "text-zinc-400")}
                  aria-label={tab.label}
                >
                  <Icon className="size-4" />
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
        </Tabs.Root>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-h-0 flex-1 py-6"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function HomeView({ meeting, providers, captureStatus, dbStatus, aiStatus, bridgeStatus, meetingType, setMeetingType, startLiveAssist, setActiveTab }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
      <Panel className="relative overflow-hidden p-7 sm:p-8">
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-lime-300/20 bg-lime-300/5 blur-2xl sm:block" />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="live"><Sparkles className="size-3.5" /> Current meeting</Badge>
          <Badge>{meeting?.platformLabel || "No platform"}</Badge>
          <Badge>{captureStatus}</Badge>
        </div>
        <div className="mt-16 max-w-4xl">
          <Eyebrow>Ready when the call starts</Eyebrow>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-white sm:text-7xl">
            {meeting?.title || "Loading meeting..."}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">{meeting?.summary || "Preparing the local meeting record."}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" onClick={startLiveAssist} disabled={!meeting}>
            <Mic className="size-4" />
            Start Live Assist
          </Button>
          <Button onClick={() => setActiveTab("settings")}>
            <Plug className="size-4" />
            Integrations
          </Button>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusTile icon={Lock} label="Storage" value={dbStatus} />
          <StatusTile icon={Radar} label="Capture" value="User-confirmed only" />
          <StatusTile icon={AudioLines} label="Audio" value="Delete after processing" />
          <StatusTile icon={WandSparkles} label="AI" value={aiStatus} />
        </div>
      </Panel>

      <div className="grid gap-5">
        <Panel>
          <Eyebrow>Meeting type</Eyebrow>
          <div className="grid grid-cols-2 gap-2">
            {[
              [MeetingTypes.founderCustomer, "Founder"],
              [MeetingTypes.candidatePrep, "Candidate"]
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMeetingType(value)}
                className={clsx("rounded-xl px-3 py-3 text-sm font-semibold transition ring-1", meetingType === value ? "bg-lime-300 text-black ring-lime-300" : "bg-white/6 text-zinc-300 ring-white/10 hover:bg-white/10")}
              >
                {label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <Eyebrow>Live assist preview</Eyebrow>
          <div className="rounded-xl bg-black/35 p-4 ring-1 ring-white/10">
            <p className="text-sm text-zinc-500">Latest question</p>
            <p className="mt-2 text-lg font-semibold text-white">{meeting?.answerSuggestion?.triggerText || "No detected question yet."}</p>
            <div className="mt-4 rounded-xl bg-lime-300/10 p-4 text-sm leading-6 text-lime-50 ring-1 ring-lime-300/20">
              {meeting?.answerSuggestion?.suggestedAnswer || "Grounded suggestions appear here during Live Mode."}
            </div>
          </div>
        </Panel>

        <Panel>
          <Eyebrow>Readiness</Eyebrow>
          <div className="grid gap-3">
            <ReadinessRow label="Extension bridge" value={bridgeStatus} />
            <ReadinessRow label="Google" value={providers.google.status} />
            <ReadinessRow label="Microsoft" value={providers.microsoft.status} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function LiveView({ meeting, captureStatus, latestQuestion, question, setQuestion, privateNotes, setPrivateNotes, suggestedAnswer, answerLoading, generateAnswer, stopCaptureAndDraftMinutes, eventBusStatus, bridgeStatus, simulatorStatus }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)]">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>Live Mode</Eyebrow>
            <h2 className="text-3xl font-semibold text-white">What should I answer?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{meeting?.title || "No meeting loaded"} · {meeting?.platformLabel || "Unknown platform"} · {captureStatus}</p>
          </div>
          <Button variant="danger" onClick={stopCaptureAndDraftMinutes}>
            <Square className="size-4" />
            Stop and draft minutes
          </Button>
        </div>

        <div className="mt-8 rounded-2xl bg-black/35 p-5 ring-1 ring-white/10">
          <p className="text-xs font-bold uppercase text-zinc-500">Detected question</p>
          <p className="mt-3 text-2xl font-semibold leading-tight text-white">{latestQuestion}</p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-xs font-bold uppercase text-zinc-500">
            Selected or latest question
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} className="field" />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase text-zinc-500">
            Private notes
            <textarea value={privateNotes} onChange={(event) => setPrivateNotes(event.target.value)} rows={4} className="field" placeholder="Facts, constraints, goals, resume notes, customer context..." />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="primary" onClick={generateAnswer} disabled={answerLoading}>
            <WandSparkles className="size-4" />
            {answerLoading ? "Generating..." : "What should I answer?"}
          </Button>
        </div>

        <motion.div layout className="mt-5 rounded-2xl bg-lime-300/10 p-5 leading-7 text-lime-50 ring-1 ring-lime-300/20">
          {suggestedAnswer}
        </motion.div>
      </Panel>

      <div className="grid gap-5">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>Named transcript</Eyebrow>
              <h3 className="text-xl font-semibold">Supporting context</h3>
            </div>
            <Badge tone={captureStatus === "Live" ? "live" : "neutral"}>{captureStatus}</Badge>
          </div>
          <div className="mt-4 grid max-h-[440px] gap-3 overflow-auto pr-1">
            {(meeting?.transcriptEvents || []).map((event: any) => <TranscriptItem key={event.id} event={event} />)}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>Capture simulator</Eyebrow>
              <h3 className="text-xl font-semibold">Emit transcript event</h3>
            </div>
            <Badge>{eventBusStatus}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{bridgeStatus}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {simulatorSources.map(({ source, label }: any) => (
              <Button key={source} onClick={() => captureEventBus.emitTranscriptEvent(createSimulatedCaptureEvent(meeting, source))} disabled={!meeting}>
                {label}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{simulatorStatus}</p>
        </Panel>
      </div>
    </div>
  );
}

function MinutesView({ meeting, minutes }: any) {
  const sections = minutes ? [
    ["Executive summary", [minutes.summary]],
    ["Decisions", minutes.decisions.map((decision: any) => formatStructuredItem(decision))],
    ["Action items", minutes.actionItems.map((actionItem: any) => formatStructuredItem(actionItem))],
    ["Open questions", minutes.openQuestions],
    ["Risks or blockers", minutes.risks],
    ["Follow-up draft", [minutes.followUpDraft]],
    ["Unresolved speaker labels", minutes.unresolvedSpeakerLabels]
  ] : [];

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Panel>
        <Eyebrow>Minutes Mode</Eyebrow>
        <h2 className="text-2xl font-semibold text-white">{meeting?.title || "Draft minutes"}</h2>
        <div className="mt-5 grid gap-3 text-sm">
          <ReadinessRow label="Meeting type" value={meeting ? meetingTypeLabel(meeting.meetingType) : "Unknown"} />
          <ReadinessRow label="Platform" value={meeting?.platformLabel || "Unknown"} />
          <ReadinessRow label="Source" value={meeting?.transcriptEvents?.length ? `${meeting.transcriptEvents.length} local transcript events` : "No transcript events yet"} />
        </div>
      </Panel>

      <article contentEditable suppressContentEditableWarning aria-label="Editable meeting minutes draft" className="min-h-[640px] rounded-2xl bg-zinc-50 p-8 text-zinc-950 shadow-2xl shadow-black/30 outline-none">
        {!minutes ? (
          <p>No minutes draft exists for this meeting yet.</p>
        ) : (
          sections.map(([title, items]: any) => (
            <section key={title} className="border-t border-zinc-200 py-5 first:border-t-0 first:pt-0">
              <h3 className="text-sm font-bold uppercase text-zinc-500">{title}</h3>
              {items.length === 1 && !["Decisions", "Action items", "Open questions", "Risks or blockers"].includes(title) ? (
                <p className="mt-3 leading-7">{items[0]}</p>
              ) : (
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
                  {items.map((item: string, index: number) => <li key={`${title}-${index}`}>{item}</li>)}
                </ul>
              )}
            </section>
          ))
        )}
      </article>
    </div>
  );
}

function SettingsView({ providers, connectProvider, disconnectProvider, syncCalendar, loadMeetingById, desktopCapture, refreshDesktopWindows, setDesktopCapture, confirmDesktopWindow, emitDesktopCaption, systemAudioFallback, setSystemAudioFallback, keepAudio, setKeepAudio, processAudioFallback, audioFallbackStatus, audioPolicyLabel }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel>
        <Eyebrow>Integrations</Eyebrow>
        <h2 className="text-2xl font-semibold">Calendar providers</h2>
        <div className="mt-5 grid gap-4">
          {(["google", "microsoft"] as const).map((id) => {
            const provider = providers[id];
            return (
              <div key={id} className="rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{providerSeed[id].name}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{provider.detail}</p>
                  </div>
                  <Badge tone={provider.status === "Connected" || provider.status === "Synced" ? "live" : "neutral"}>{provider.status}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => connectProvider(id)} disabled={!provider.configured || provider.connected || provider.busy}>Connect</Button>
                  <Button onClick={() => syncCalendar(id)} disabled={!provider.connected || provider.busy}>Sync events</Button>
                  <Button variant="ghost" onClick={() => disconnectProvider(id)} disabled={!provider.connected || provider.busy}>Disconnect</Button>
                </div>
                <div className="mt-4 grid gap-2">
                  {provider.events.length ? provider.events.map((item: any) => (
                    <button key={item.id} onClick={() => loadMeetingById(item.id)} className="rounded-xl bg-white/6 p-3 text-left ring-1 ring-white/10 transition hover:bg-white/10">
                      <strong className="block text-sm">{item.title}</strong>
                      <span className="text-xs text-zinc-500">{item.platformLabel} · {item.participants.length} participant{item.participants.length === 1 ? "" : "s"}</span>
                    </button>
                  )) : <p className="text-sm text-zinc-500">No imported meetings shown.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <Eyebrow>Privacy</Eyebrow>
        <h2 className="text-2xl font-semibold">{audioPolicyLabel}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Audio is fallback data and should be deleted by default unless a meeting explicitly opts in to keeping it.</p>
        <label className="mt-5 flex gap-3 text-sm text-zinc-300">
          <input type="checkbox" checked={systemAudioFallback} onChange={(event) => setSystemAudioFallback(event.target.checked)} />
          Enable fallback system audio for this session
        </label>
        <label className="mt-3 flex gap-3 text-sm text-zinc-300">
          <input type="checkbox" checked={keepAudio} onChange={(event) => setKeepAudio(event.target.checked)} />
          Keep audio for this meeting instead of deleting after processing
        </label>
        <Button className="mt-4" onClick={processAudioFallback}>Process diarized fallback</Button>
        <p className="mt-3 text-sm text-zinc-500">{audioFallbackStatus}</p>
      </Panel>

      <Panel className="xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>Desktop Capture Agent</Eyebrow>
            <h2 className="text-2xl font-semibold">Meeting windows and permissions</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{desktopCapture.help}</p>
          </div>
          <Badge tone={desktopCapture.status === "Confirmed" ? "live" : "neutral"}>{desktopCapture.status}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={refreshDesktopWindows}><Laptop className="size-4" />Refresh desktop windows</Button>
          <Button variant="primary" onClick={confirmDesktopWindow} disabled={!desktopCapture.selected}>Confirm selected window</Button>
          <Button onClick={() => emitDesktopCaption(TranscriptSources.desktopAccessibility)} disabled={desktopCapture.status !== "Confirmed"}>Emit accessibility caption</Button>
          <Button onClick={() => emitDesktopCaption(TranscriptSources.desktopOcr)} disabled={desktopCapture.status !== "Confirmed"}>Emit OCR fallback</Button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {desktopCapture.windows.length ? desktopCapture.windows.map((item: any) => (
            <button
              key={`${item.appName}-${item.title}`}
              onClick={() => setDesktopCapture((current: any) => ({ ...current, selected: item, status: "Window selected" }))}
              className={clsx("rounded-xl p-3 text-left ring-1 transition", desktopCapture.selected === item ? "bg-lime-300/10 ring-lime-300/30" : "bg-white/6 ring-white/10 hover:bg-white/10")}
            >
              <strong className="block text-sm">{item.title}</strong>
              <span className="text-xs text-zinc-500">{item.appName} · {item.platformHint}</span>
            </button>
          )) : (
            <div className="rounded-xl bg-amber-300/10 p-4 text-sm leading-6 text-amber-100 ring-1 ring-amber-300/20">
              {desktopCapture.permissionHelp?.join(" ") || "No desktop windows checked yet."}
            </div>
          )}
        </div>
      </Panel>

      <Panel className="xl:col-span-2">
        <Eyebrow>Evaluated interview boundary</Eyebrow>
        <h2 className="text-2xl font-semibold">Grounded help only</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">Candidate workflows support prep, mock interviews, truthful recall, and disclosed or permitted coding help. The product should not optimize for concealing assistance from an evaluator.</p>
      </Panel>
    </div>
  );
}

function TranscriptItem({ event }: any) {
  const validation = validateTranscriptEvent(event);
  const isUncertain = [SpeakerConfidence.medium, SpeakerConfidence.low].includes(event.speakerConfidence);
  return (
    <article className={clsx("rounded-xl border border-white/10 bg-white/5 p-4", isUncertain && "border-amber-300/20")}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <strong>{event.speakerName}{isUncertain ? " ?" : ""}</strong>
        <span className="text-zinc-500">{formatTime(event.timestamp)}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{event.text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={isUncertain ? "warn" : "neutral"}>{confidenceLabel(event.speakerConfidence)}</Badge>
        <Badge>{event.source}</Badge>
        <Badge>{event.sourceConfidence} source</Badge>
        {!validation.ok && <Badge tone="warn">{validation.error}</Badge>}
      </div>
    </article>
  );
}

function StatusTile({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl bg-black/25 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center gap-2 text-zinc-500">
        <Icon className="size-4" />
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <p className="text-sm font-semibold leading-5 text-zinc-200">{value}</p>
    </div>
  );
}

function ReadinessRow({ label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-lime-300/14 text-lime-200">
        <Check className="size-3" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
        <p className="break-words text-sm leading-5 text-zinc-300">{value}</p>
      </div>
      <ChevronRight className="ml-auto size-4 flex-none text-zinc-700" />
    </div>
  );
}
