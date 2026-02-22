import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const AUTH_TOKEN_KEY = 'mesa_token'
const AUTH_COOKIE_NAME = 'mesa_token'

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=86400; SameSite=Lax`
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

const apiClient = axios.create({ baseURL: API_BASE })

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (email: string, password: string) =>
    apiClient.post('/auth/register', { email, password }),
  login: (email: string, password: string) => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    return apiClient.post<{ access_token: string }>('/auth/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => apiClient.get('/auth/me'),
}

export const reportsApi = {
  list: () => apiClient.get('/reports/'),
  getHtml: (id: number) => apiClient.get<string>(`/reports/${id}/html`),
  generate: () => apiClient.post('/reports/generate'),
}

export const settingsApi = {
  update: (data: {
    report_level: string
    report_frequency: string
    selected_indicators: string[]
  }) => apiClient.patch('/settings/', data),
}

export const indicatorsApi = {
  list: () => apiClient.get('/indicators/'),
}
