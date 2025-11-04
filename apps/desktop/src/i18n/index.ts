import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

// 从localStorage获取保存的语言设置，默认为英文
const savedLanguage = localStorage.getItem('promptx-language') || 'en'

const resources = {
  en: {
    translation: en
  },
  "zh-CN": {
    translation: zhCN
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

// 异步加载主进程中保存的语言设置
const loadLanguageFromMain = async () => {
  try {
    if (window.electronAPI) {
      const mainLanguage = await window.electronAPI.invoke('settings:getLanguage')
      if (mainLanguage && mainLanguage !== i18n.language) {
        await i18n.changeLanguage(mainLanguage)
        localStorage.setItem('promptx-language', mainLanguage)
      }
    }
  } catch (error) {
    console.error('Failed to load language from main process:', error)
  }
}

// 在DOM加载完成后尝试从主进程加载语言设置
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', loadLanguageFromMain)
  // 如果DOM已经加载完成，直接执行
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadLanguageFromMain()
  }
}

export default i18n