import { LogsViewer } from "./components/LogsViewer"
import { Toaster } from "sonner"

export default function LogsWindow() {

  return (
    <div className="h-[calc(100vh-53px)] flex flex-col ">
      <Toaster />
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <LogsViewer />
      </div>
    </div>
  )
}
