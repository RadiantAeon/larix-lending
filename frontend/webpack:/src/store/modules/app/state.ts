
// 驱动应用的数据源，包含了全部的应用层级状态，唯一数据源。
import { getLocale } from '@/locales'

export interface AppState {
  language: string
}

export const state: AppState = {
  language: getLocale()
}
