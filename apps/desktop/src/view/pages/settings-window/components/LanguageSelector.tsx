import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface Language {
  code: string
  name: string
  nativeName: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' }
]

export function LanguageSelector() {
  const { t, i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

  // 初始化时从主进程加载语言设置
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await window.electronAPI?.invoke('settings:getLanguage')
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage)
          setCurrentLanguage(savedLanguage)
        }
      } catch (error) {
        console.error('Failed to load language setting:', error)
      }
    }
    
    loadLanguage()
  }, [i18n])

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode)
      setCurrentLanguage(languageCode)
      
      // 保存到localStorage
      localStorage.setItem('promptx-language', languageCode)
      
      // 通知主进程保存语言设置
      await window.electronAPI?.invoke('settings:setLanguage', languageCode)
      
      toast.success(t('messages.languageChanged'))
    } catch (error) {
      console.error('Failed to change language:', error)
      toast.error('Failed to change language')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.language.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant="outline"
              className={`w-full justify-between ${
                currentLanguage === language.code 
                  ? 'bg-black text-white border-black hover:bg-gray-800 hover:text-white' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span>{language.nativeName}</span>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4" />
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}