import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import styles from './TableQrCode.module.css'

/**
 * The QR code of a table, drawn from the absolute URL of that table so the
 * printed code works from any phone, not only the one that rendered it.
 */
export function TableQrCode({
  path,
  title,
  size = 128,
}: {
  path: string
  title: string
  size?: number
}) {
  const [svg, setSvg] = useState<string | null>(null)
  const url = absoluteUrl(path)

  useEffect(() => {
    let active = true
    QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a1816', light: '#ffffff' },
    })
      .then((markup) => {
        if (active) setSvg(markup)
      })
      .catch(() => {
        // A missing QR is a cosmetic loss: the card is still a working link.
        if (active) setSvg(null)
      })
    return () => {
      active = false
    }
  }, [url])

  return (
    <span
      className={styles.frame}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title}
      title={url}
      // The markup comes from the QR library over a URL this app built, never
      // from user input.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}

function absoluteUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${base}${path}`
}
