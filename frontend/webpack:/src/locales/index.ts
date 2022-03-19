
// 导入自定义语言包
import enLocale from './en'
import zhLocale from './zh-cn'
import inLocale from './in'
import vnLocale from './vn'
import knLocale from './kn'
import ruLocale from './ru'
import trLocale from './tr'
//用户语言偏好设置，我们持久化到cookie中，通过getLanguage获取。
import { getLanguage } from '@/utils/cookies'
// 创建i18n实例
//@ts-ignore
import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    ...enLocale,
  },
  'zh-cn': {
    ...zhLocale,
  },
  in:{
    ...inLocale,
  },
  vn:{
    ...vnLocale
  },
  kn:{
    ...knLocale
  },
  ru:{
    ...ruLocale
  },
  tr:{
    ...trLocale
  }
}



export const getLocale = () => {
  // 读取cookie存入的当前语言
  const cookieLanguage = getLanguage()
  // 如果有返回当前语言
  if (cookieLanguage) {
    return cookieLanguage
  }
  // 如果没有，获取系统语言
  const language = navigator.language.toLowerCase()
  // 获取messages 语言 遍历
  const locales = Object.keys(messages)
  for (const locale of locales) {
    // 如果messsage 包里面有系统语言返回
    if (language.indexOf(locale) > -1) {
      return locale
    }
  }

  // 默认语言 简体中文
  return 'en'
}


// 创建i18n实例
const i18n = createI18n({
  // locale: getLocale(),
  locale: 'en',
  messages: messages
})

export default i18n
