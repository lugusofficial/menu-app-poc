import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DishImage } from './DishImage'

// The base path differs between dev, the test runner and GitHub Pages, so the
// assertion is about the path the component builds, not the deployment prefix.
const BASE = import.meta.env.BASE_URL

describe('DishImage', () => {
  it('points at the thumbnail file for a dish that has a photo', () => {
    const { container } = render(<DishImage image="ancho" emoji="🥩" size="thumb" />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('src', `${BASE}dishes/ancho-thumb.webp`)
  })

  it('points at the full size file for the hero', () => {
    const { container } = render(<DishImage image="ancho" emoji="🥩" size="hero" />)
    expect(container.querySelector('img')).toHaveAttribute('src', `${BASE}dishes/ancho.webp`)
  })

  it('carries explicit dimensions so the row does not jump as photos load', () => {
    const { container } = render(<DishImage image="ancho" emoji="🥩" size="thumb" />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('width', '64')
    expect(img).toHaveAttribute('height', '64')
  })

  it('lazy loads by default and eagerly only when asked', () => {
    const { container, rerender } = render(<DishImage image="ancho" emoji="🥩" size="thumb" />)
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
    rerender(<DishImage image="ancho" emoji="🥩" size="hero" eager />)
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager')
  })

  it('leaves alt empty, because the dish name is always next to it in text', () => {
    const { container } = render(<DishImage image="ancho" emoji="🥩" size="thumb" />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('falls back to the emoji when the dish has no photo', () => {
    const { container } = render(<DishImage image={null} emoji="🥩" size="thumb" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('🥩')).toBeInTheDocument()
  })

  it('falls back to the emoji when the file fails to load', () => {
    const { container } = render(<DishImage image="missing" emoji="🥩" size="thumb" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('🥩')).toBeInTheDocument()
  })
})
