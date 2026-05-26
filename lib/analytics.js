'use client'

function cleanObject(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

function gtagEvent(eventName, payload = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, cleanObject(payload))
}

function fbqTrack(eventName, payload = {}) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', eventName, cleanObject(payload))
}

function fbqTrackCustom(eventName, payload = {}) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('trackCustom', eventName, cleanObject(payload))
}

export function trackPageView({ path, title } = {}) {
  const pagePath = path || (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '')
  gtagEvent('page_view', {
    page_path: pagePath,
    page_title: title || (typeof document !== 'undefined' ? document.title : undefined),
  })
  fbqTrack('PageView')
}

export function trackViewContent({
  content_id,
  content_name,
  content_type = 'product',
  value,
  currency = 'BRL',
  product_type,
  category,
} = {}) {
  const payload = cleanObject({
    content_id: content_id ? String(content_id) : undefined,
    content_name,
    content_type,
    value: Number(value || 0) > 0 ? Number(value) : undefined,
    currency,
    product_type,
    category,
  })

  gtagEvent('view_item', {
    currency,
    value: payload.value,
    items: [
      cleanObject({
        item_id: payload.content_id,
        item_name: content_name,
        item_category: category,
        item_category2: product_type,
      }),
    ],
  })
  fbqTrack('ViewContent', {
    ...payload,
    content_ids: payload.content_id ? [payload.content_id] : undefined,
    content_category: category,
  })
}

export function trackCategoryView({ category_name, product_type } = {}) {
  const payload = cleanObject({ category_name, product_type, content_type: 'category' })
  gtagEvent('category_view', payload)
  fbqTrackCustom('CategoryView', payload)
  fbqTrack('ViewContent', {
    content_name: category_name || product_type || 'Categoria',
    content_type: 'product_group',
    content_category: category_name,
  })
}

export function trackSearch({ search_term, results_count } = {}) {
  const payload = cleanObject({ search_term, search_string: search_term, results_count })
  if (!payload.search_term) return
  gtagEvent('search', payload)
  fbqTrack('Search', payload)
}

export function trackContact(payload = {}) {
  gtagEvent('generate_lead', cleanObject({ method: 'whatsapp', ...payload }))
  fbqTrack('Contact', cleanObject({ method: 'whatsapp', ...payload }))
}

export function trackWhatsAppClick(payload = {}) {
  const cleanPayload = cleanObject({ method: 'whatsapp', ...payload })
  trackContact(cleanPayload)
  gtagEvent('whatsapp_click', cleanPayload)
  fbqTrackCustom('WhatsAppClick', cleanPayload)
}
