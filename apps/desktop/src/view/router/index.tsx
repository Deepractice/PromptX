import { createHashRouter, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import ResourcesWindow from '../pages/resources-window'
import SettingsWindow from '../pages/settings-window'
import '../../i18n' // 导入国际化配置
const routes: RouteObject[] = [
  { path: '/resources', element: <ResourcesWindow /> },
  { path: '/settings', element: <SettingsWindow /> },
  { path: '*', element: <Navigate to="/resources" replace /> }
]

export const router: ReturnType<typeof createHashRouter> = createHashRouter(routes)
export default router