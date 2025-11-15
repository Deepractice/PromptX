import { createHashRouter, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import MainWindow from '../pages/main-window'
import ResourcesWindow from '../pages/resources-window'
import SettingsWindow from '../pages/settings-window'
import LogsWindow from '../pages/logs-window'
import '../../i18n' // 导入国际化配置
const routes: RouteObject[] = [
  { path: '/', element: <MainWindow /> },
  { path: '/main', element: <MainWindow /> },
  { path: '/resources', element: <ResourcesWindow /> },
  { path: '/settings', element: <SettingsWindow /> },
  { path: '/logs', element: <LogsWindow /> },
  { path: '*', element: <Navigate to="/" replace /> }
]

export const router: ReturnType<typeof createHashRouter> = createHashRouter(routes)
export default router