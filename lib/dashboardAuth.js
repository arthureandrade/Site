export const DASHBOARD_PASSWORD = 'ferro123'

export function lerDashboardCookie() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)dashboard_auth=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}
