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
import { Database, FileText, Settings } from "lucide-react"
import ResourcesPage from "../resources-window"
import LogsPage from "../logs-window"
import SettingsPage from "../settings-window"
import logo from "../../../../assets/icons/icon-64x64.png"
type PageType = "resources" | "logs" | "settings" | "update"

function MainContent() {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState<PageType>("resources")
  const { open } = useSidebar()

  const menuItems = [
    {
      id: "resources" as PageType,
      title: t("sidebar.resources"),
      icon: Database,
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

  const renderPage = () => {
    switch (currentPage) {
      case "resources":
        return <ResourcesPage />
      case "logs":
        return <LogsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <ResourcesPage />
    }
  }

  return (
    <div className="flex h-screen w-full">
      <Toaster />
      <Sidebar className="w-[12vw]">
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

      <main className={`flex-1 overflow-hidden ${open ? 'ml-[12vw]' : ''}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-3 bg-background">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">
              {menuItems.find((item) => item.id === currentPage)?.title}
            </h2>
          </div>
          <div className="h-[calc(100vh-53px)] overflow-auto">{renderPage()}</div>
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
