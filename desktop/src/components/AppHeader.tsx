import * as Tabs from "@radix-ui/react-tabs";
import { Bot } from "lucide-react";
import { clsx } from "clsx";
import { tabs } from "../app/constants";
import { Badge } from "./ui";

export function AppHeader({ activeTab, setActiveTab, runtimeVersion, liveSessionActive }: any) {
  return (
    <>
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
    </>
  );
}
