export type ReportLevel = 'beginner' | 'standard' | 'expert'
export type ReportFrequency = 'daily' | 'weekly' | 'monthly'

export interface User {
  id: number
  email: string
  report_level: ReportLevel
  report_frequency: ReportFrequency
  selected_indicators: string[]
  push_enabled: boolean
}

export interface Report {
  id: number
  title: string
  summary: string
  level: ReportLevel
  indicators_used: string[]
  is_read: boolean
  created_at: string
}

export interface Indicator {
  id: string
  name_ko: string
  description: string
  category: string
  importance: number
  default_selected: boolean
}
