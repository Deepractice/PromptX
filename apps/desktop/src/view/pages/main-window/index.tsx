import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Toaster } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Store, FileText, Settings, Pickaxe, MessageSquare, UsersRound, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import ResourcesPage from "../resources-window"
import LogsPage from "../logs-window"
import SettingsPage from "../settings-window"
import ToolsPage from "../tools-window"
import RolesPage from "../roles-window"
import AgentXPage from "../agentx-window"
import logo from "../../../../assets/icons/icon-64x64.png"
type PageType = "resources" | "logs" | "settings" | "update" |"agentx"|"roles"|"tools"

function MainContent() {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState<PageType>("agentx")
  const { open } = useSidebar()

  const menuItems = [
    {
      id: "agentx" as PageType,
      title: t("sidebar.agentx"),
      icon: MessageSquare,
    },
    {
      id: "resources" as PageType,
      title: t("sidebar.resources"),
      icon: Store,
    },
    {
      id: "roles" as PageType,
      title: t("sidebar.roles"),
      icon: UsersRound,
    },
    {
      id: "tools" as PageType,
      title: t("sidebar.tools"),
      icon: Pickaxe,
    },
    {
      id: "logs" as PageType,
      title: t("sidebar.logs"),
      icon: FileText,
    },
    {
      id: "settings" as PageType,
      title: t("sidebar.settings"),
      icon: Settings,
    },
  ]

  const handleCreateTool = () => {
    // Store pending message for Studio to pick up when ready
    ;(window as any).__agentx_pending_message = t("agentxUI.welcome.presets.lubanPrompt")
    setCurrentPage("agentx")
  }

  const renderHeaderActions = () => {
    switch (currentPage) {
      case "tools":
        return (
          <Button size="sm" className="h-7 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={handleCreateTool}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("tools.detail.createTool")}
          </Button>
        )
      default:
        return null
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case "agentx":
        return <AgentXPage />
      case "resources":
        return <ResourcesPage />
      case "logs":
        return <LogsPage />
      case "settings":
        return <SettingsPage />
      case "roles":
        return <RolesPage />
      case "tools":
        return <ToolsPage />
      default:
        return <AgentXPage />
    }
  }

  return (
    <div className="flex h-screen w-full">
      <Toaster />
      <Sidebar className="w-[12vw] ">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-4">
            <img src={logo} alt="PromptX Logo" className="h-8 w-8" />
            <span className="text-lg font-semibold">PromptX</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.id)}
                      isActive={currentPage === item.id}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <main className={`flex-1 overflow-hidden ${open ? 'ml-[12vw] ' : ''}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h2 className="text-lg font-semibold">
                {menuItems.find((item) => item.id === currentPage)?.title}
              </h2>
            </div>
            {renderHeaderActions()}
          </div>
          <div className="h-[calc(100vh-53px)] overflow-auto ">{renderPage()}</div>
        </div>
      </main>
    </div>
  )
}

export default function MainWindow() {
  return (
    <SidebarProvider>
      <MainContent />
    </SidebarProvider>
  )
}
