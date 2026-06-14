import { AnimatePresence, motion } from "framer-motion";
import { useMeetingCopilot } from "./app/useMeetingCopilot";
import { AppHeader } from "./components/AppHeader";
import { HomeView } from "./views/HomeView";
import { LiveView } from "./views/LiveView";
import { MinutesView } from "./views/MinutesView";
import { SettingsView } from "./views/SettingsView";

export function App() {
  const copilot = useMeetingCopilot();

  function renderContent() {
    if (copilot.activeTab === "home") {
      return (
        <HomeView
          meeting={copilot.meeting}
          providers={copilot.providers}
          captureStatus={copilot.captureStatus}
          dbStatus={copilot.dbStatus}
          aiStatus={copilot.aiStatus}
          bridgeStatus={copilot.bridgeStatus}
          meetingType={copilot.meetingType}
          setMeetingType={copilot.setMeetingTypeFromPicker}
          startLiveAssist={copilot.startLiveAssist}
          setActiveTab={copilot.setActiveTab}
        />
      );
    }

    if (copilot.activeTab === "live") {
      return (
        <LiveView
          meeting={copilot.meeting}
          captureStatus={copilot.captureStatus}
          latestQuestion={copilot.latestQuestion}
          question={copilot.question}
          setQuestion={copilot.setQuestion}
          privateNotes={copilot.privateNotes}
          setPrivateNotes={copilot.setPrivateNotes}
          suggestedAnswer={copilot.suggestedAnswer}
          answerLoading={copilot.answerLoading}
          generateAnswer={copilot.generateAnswer}
          stopCaptureAndDraftMinutes={copilot.stopCaptureAndDraftMinutes}
          eventBusStatus={copilot.eventBusStatus}
          bridgeStatus={copilot.bridgeStatus}
          simulatorStatus={copilot.simulatorStatus}
        />
      );
    }

    if (copilot.activeTab === "minutes") {
      return <MinutesView meeting={copilot.meeting} minutes={copilot.minutes} />;
    }

    return (
      <SettingsView
        providers={copilot.providers}
        connectProvider={copilot.connectProvider}
        disconnectProvider={copilot.disconnectProvider}
        syncCalendar={copilot.syncCalendarFromSettings}
        loadMeetingById={copilot.loadMeetingByIdFromSettings}
        desktopCapture={copilot.desktopCapture}
        refreshDesktopWindows={copilot.refreshDesktopWindows}
        setDesktopCapture={copilot.setDesktopCapture}
        confirmDesktopWindow={copilot.confirmDesktopWindow}
        emitDesktopCaption={copilot.emitDesktopCaption}
        systemAudioFallback={copilot.systemAudioFallback}
        setSystemAudioFallback={copilot.setSystemAudioFallback}
        keepAudio={copilot.keepAudio}
        setKeepAudio={copilot.setKeepAudio}
        processAudioFallback={copilot.processAudioFallback}
        audioFallbackStatus={copilot.audioFallbackStatus}
        audioPolicyLabel={copilot.audioPolicyLabel}
      />
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(190,242,100,.13),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,.08),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-4 sm:px-8">
        <AppHeader
          activeTab={copilot.activeTab}
          setActiveTab={copilot.setActiveTab}
          runtimeVersion={copilot.runtimeVersion}
          liveSessionActive={copilot.liveSessionActive}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={copilot.activeTab}
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
