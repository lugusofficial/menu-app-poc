import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { CustomAmountField } from './CustomAmountField'

function Harness({ initialCents = 0 }: { initialCents?: number }) {
  const [cents, setCents] = useState(initialCents)
  return (
    <>
      <CustomAmountField id="amount" label="How much Ana will pay" cents={cents} onChange={setCents} />
      <output data-testid="cents">{cents}</output>
      <button type="button" onClick={() => setCents(3333)}>
        set from outside
      </button>
    </>
  )
}

describe('CustomAmountField', () => {
  it('starts empty when there is no amount yet', () => {
    render(<Harness />)
    expect(screen.getByLabelText('How much Ana will pay')).toHaveValue('')
  })

  it('shows a stored amount with a comma decimal separator', () => {
    render(<Harness initialCents={3050} />)
    expect(screen.getByLabelText('How much Ana will pay')).toHaveValue('30,50')
  })

  it('keeps what is typed instead of reformatting between keystrokes', async () => {
    render(<Harness />)
    const field = screen.getByLabelText('How much Ana will pay')
    await userEvent.type(field, '50')
    expect(field).toHaveValue('50')
    expect(screen.getByTestId('cents')).toHaveTextContent('5000')
  })

  it('reports cents for an amount typed with a comma', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('How much Ana will pay'), '12,50')
    expect(screen.getByTestId('cents')).toHaveTextContent('1250')
  })

  it('reports zero when the field is cleared', async () => {
    render(<Harness initialCents={1000} />)
    await userEvent.clear(screen.getByLabelText('How much Ana will pay'))
    expect(screen.getByTestId('cents')).toHaveTextContent('0')
  })

  it('tidies the text on blur', async () => {
    render(<Harness />)
    const field = screen.getByLabelText('How much Ana will pay')
    await userEvent.type(field, '7')
    await userEvent.tab()
    expect(field).toHaveValue('7,00')
  })

  it('picks up an amount set from outside the field', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'set from outside' }))
    expect(screen.getByLabelText('How much Ana will pay')).toHaveValue('33,33')
  })

  it('does not fight the typist when the parent echoes the same value back', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <CustomAmountField id="amount" label="Amount" cents={0} onChange={onChange} />,
    )
    await userEvent.type(screen.getByLabelText('Amount'), '50')
    rerender(<CustomAmountField id="amount" label="Amount" cents={5000} onChange={onChange} />)
    expect(screen.getByLabelText('Amount')).toHaveValue('50')
  })
})
