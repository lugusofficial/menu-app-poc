import { useState } from 'react'
import styles from './DishImage.module.css'

type Size = 'thumb' | 'hero'

const DIMENSIONS: Record<Size, { width: number; height: number }> = {
  // Both carry explicit dimensions so the row never reflows as photos arrive.
  thumb: { width: 64, height: 64 },
  hero: { width: 360, height: 240 },
}

/**
 * A dish photo, with the emoji as the fallback.
 *
 * The photo is decorative: the dish name always sits next to it in text, so
 * `alt` is empty rather than repeating the name to a screen reader. If the file
 * is missing or fails to load the emoji takes its place, which keeps a row
 * readable instead of leaving a broken frame.
 */
export function DishImage({
  image,
  emoji,
  size,
  eager = false,
}: {
  image: string | null
  emoji: string
  size: Size
  eager?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const { width, height } = DIMENSIONS[size]

  if (!image || failed) {
    return (
      <span className={`${styles.fallback} ${styles[size]}`} aria-hidden="true">
        {emoji}
      </span>
    )
  }

  const suffix = size === 'thumb' ? '-thumb' : ''
  return (
    <img
      className={`${styles.image} ${styles[size]}`}
      src={`${import.meta.env.BASE_URL}dishes/${image}${suffix}.webp`}
      alt=""
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
