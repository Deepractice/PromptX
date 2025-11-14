import { LogsViewer } from "./components/LogsViewer"
import { Toaster } from "sonner"
import { useTranslation } from "react-i18next"

export default function LogsWindow() {
  const { t } = useTranslation()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster />
      <div className="shrink-0  p-6 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{t("logs.title")}</h1>
        <p className="mt-2 text-sm text-gray-600">{t("logs.subtitle")}</p>
      </div>
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <LogsViewer />
      </div>
    </div>
  )
}
