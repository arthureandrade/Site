'use client'

import { trackWhatsAppClick } from '@/lib/analytics'

export default function TrackedWhatsAppLink({
  href,
  children,
  className = '',
  label = 'WhatsApp',
  eventData = {},
  ...props
}) {
  function handleClick(event) {
    props.onClick?.(event)
    trackWhatsAppClick({
      label,
      link_url: href,
      ...eventData,
    })
  }

  return (
    <a
      {...props}
      href={href}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}
