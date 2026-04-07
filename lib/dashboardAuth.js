export const DASHBOARD_PASSWORD = '8459'

export function lerDashboardCookie() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)dashboard_auth=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}
