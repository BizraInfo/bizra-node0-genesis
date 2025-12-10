import { render, screen } from '@testing-library/react'
import { BilingualText } from '@/components/ai-os/BilingualText'

describe('BilingualText', () => {
  it('renders English text', () => {
    render(<BilingualText english="Hello" arabic="مرحبا" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders Arabic text when showArabic is true', () => {
    render(<BilingualText english="Hello" arabic="مرحبا" showArabic={true} />)
    expect(screen.getByText('مرحبا')).toBeInTheDocument()
  })

  it('does not render Arabic text when showArabic is false', () => {
    render(<BilingualText english="Hello" arabic="مرحبا" showArabic={false} />)
    expect(screen.queryByText('مرحبا')).not.toBeInTheDocument()
  })

  it('applies className', () => {
    const { container } = render(
      <BilingualText english="Hello" arabic="مرحبا" className="test-class" />
    )
    expect(container.querySelector('.test-class')).toBeInTheDocument()
  })
})

