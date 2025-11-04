import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface TranslationData {
  [key: string]: any;
}

class MainI18n {
  private translations: TranslationData = {};
  private currentLocale: string = 'en';
  private initialized: boolean = false;

  constructor() {
    // 延迟初始化，等待 app ready
    if (app.isReady()) {
      this.init();
    } else {
      app.whenReady().then(() => {
        this.init();
      });
    }
  }

  private init() {
    if (this.initialized) return;
    
    // 首先尝试读取保存的语言设置
    try {
      const configPath = path.join(app.getPath('userData'), 'language.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.language) {
          this.currentLocale = config.language;
          this.loadTranslations();
          this.initialized = true;
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved language setting:', error);
    }

    // 如果没有保存的设置，使用系统语言
    const systemLocale = app.getLocale();
    
    // 根据系统语言设置默认语言
    if (systemLocale.startsWith('zh')) {
      this.currentLocale = 'zh-CN';
    } else {
      this.currentLocale = 'en';
    }

    this.loadTranslations();
    this.initialized = true;
  }

  private loadTranslations() {
    try {
      // 在开发环境和生产环境中都能正确找到翻译文件
      let translationsDir: string;
      
      if (process.env.NODE_ENV === 'development') {
        // 开发环境：使用源码目录
        translationsDir = path.join(__dirname, '../../src/main/i18n');
      } else {
        // 生产环境：翻译文件被复制到主进程输出目录的i18n子目录
        translationsDir = path.join(__dirname, 'i18n');
      }
      
      const translationFile = path.join(translationsDir, `${this.currentLocale}.json`);
      
      console.log(`Loading translations from: ${translationFile}`);
      
      if (fs.existsSync(translationFile)) {
        const content = fs.readFileSync(translationFile, 'utf-8');
        this.translations = JSON.parse(content);
        console.log(`Loaded translations for ${this.currentLocale}:`, Object.keys(this.translations));
      } else {
        console.warn(`Translation file not found: ${translationFile}`);
        // 如果找不到对应语言文件，回退到英文
        const fallbackFile = path.join(translationsDir, 'en.json');
        console.log(`Trying fallback file: ${fallbackFile}`);
        if (fs.existsSync(fallbackFile)) {
          const content = fs.readFileSync(fallbackFile, 'utf-8');
          this.translations = JSON.parse(content);
          console.log(`Loaded fallback translations:`, Object.keys(this.translations));
        } else {
          console.error(`Fallback translation file not found: ${fallbackFile}`);
        }
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      this.translations = {};
    }
  }

  public t(key: string, params?: Record<string, any>): string {
    // 如果还未初始化，先尝试初始化
    if (!this.initialized) {
      this.init();
    }
    
    const keys = key.split('.');
    let value: any = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // 如果找不到翻译，返回原始key
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}`);
      return key;
    }

    // 处理参数替换
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }

    return value;
  }

  public setLocale(locale: string) {
    this.currentLocale = locale;
    this.loadTranslations();
  }

  public getCurrentLocale(): string {
    return this.currentLocale;
  }
}

// 创建单例实例
export const mainI18n = new MainI18n();

// 导出翻译函数
export const t = (key: string, params?: Record<string, any>) => mainI18n.t(key, params);