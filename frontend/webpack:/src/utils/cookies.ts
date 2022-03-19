// cookies封装
import Keys from '@/constant/key'
import Cookies from 'js-cookie'
   
export const getLanguage = () => Cookies.get(Keys.languageKey)
export const setLanguage = (language: string) => Cookies.set(Keys.languageKey, language)
