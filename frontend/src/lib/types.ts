export interface User {
  id: number
  email: string
  report_level: 'beginner' | 'standard' | 'expert'
  report_frequency: 'daily' | 'weekly' | 'monthly'
  selected_indicators: string[]
}

export interface Report {
  id: number
  title: string
  summary: string
  level: 'beginner' | 'standard' | 'expert'
  created_at: string
  is_read: boolean
}

export interface Indicator {
  id: string
  name_ko: string
  description: string
  category: string
  importance: number
  default_selected: boolean
}
