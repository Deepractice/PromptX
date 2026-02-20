import { useState } from "react"
import { useTranslation } from "react-i18next"
import MemoryOverview from "./memory/MemoryOverview"
import MemoryEngramList from "./memory/MemoryEngramList"
import MemoryNetwork from "./memory/MemoryNetwork"
import MemoryCueExplorer from "./memory/MemoryCueExplorer"

type SubView = "overview" | "engrams" | "network" | "cues"

export default function MemoryTab({ roleId }: { roleId: string }) {
  const { t } = useTranslation()
  const [activeView, setActiveView] = useState<SubView>("overview")
  const [selectedCue, setSelectedCue] = useState<string | undefined>()

  const tabs: { key: SubView; label: string }[] = [
    { key: "overview", label: t("roles.memory.overview") },
    { key: "engrams", label: t("roles.memory.engrams") },
    { key: "network", label: t("roles.memory.network") },
    { key: "cues", label: t("roles.memory.cues") },
  ]

  const handleSelectCue = (word: string) => {
    setSelectedCue(word)
    setActiveView("cues")
  }

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeView === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active sub-view */}
      {activeView === "overview" && <MemoryOverview roleId={roleId} />}
      {activeView === "engrams" && <MemoryEngramList roleId={roleId} />}
      {activeView === "network" && <MemoryNetwork roleId={roleId} onSelectCue={handleSelectCue} />}
      {activeView === "cues" && <MemoryCueExplorer roleId={roleId} initialCue={selectedCue} />}
    </div>
  )
}
