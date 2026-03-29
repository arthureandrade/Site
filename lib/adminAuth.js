export const ADMIN_PASSWORD = 'ferro123'

export function lerAdminCookie() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)admin_auth=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

