import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('mesa_token') || '' : ''
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

export const authApi = {
  register(email: string, password: string) {
    return axios.post(`${BASE_URL}/auth/register`, { email, password })
  },
  login(email: string, password: string) {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    return axios.post(`${BASE_URL}/auth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me() {
    return axios.get(`${BASE_URL}/auth/me`, { headers: authHeaders() })
  },
}

export const reportsApi = {
  list() {
    return axios.get(`${BASE_URL}/reports/`, { headers: authHeaders() })
  },
  getHtml(id: number) {
    return axios.get(`${BASE_URL}/reports/${id}/html`, { headers: authHeaders() })
  },
  generate() {
    return axios.post(`${BASE_URL}/reports/generate`, {}, { headers: authHeaders() })
  },
}

export const settingsApi = {
  update(data: {
    report_level: string
    report_frequency: string
    selected_indicators: string[]
  }) {
    return axios.patch(`${BASE_URL}/settings/`, data, { headers: authHeaders() })
  },
}

export const indicatorsApi = {
  list() {
    return axios.get(`${BASE_URL}/indicators/`, { headers: authHeaders() })
  },
}
