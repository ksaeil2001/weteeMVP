/**
 * Card Component Tests
 *
 * Tests for:
 * - Rendering with different variants
 * - Click handling
 * - Padding variants
 * - Highlighted state
 * - Keyboard accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from '../Card'

describe('Card Component', () => {
  describe('Basic rendering', () => {
    it('renders children', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('renders default variant by default', () => {
      render(<Card>Content</Card>)
      const card = screen.getByText('Content').parentElement
      expect(card).toHaveClass('border-gray-200')
    })
  })

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Card variant="default">Default</Card>)
      const card = screen.getByText('Default').parentElement
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('border-gray-200')
    })

    it('renders elevated variant with shadow', () => {
      render(<Card variant="elevated">Elevated</Card>)
      const card = screen.getByText('Elevated').parentElement
      expect(card).toHaveClass('shadow-md')
    })

    it('renders outlined variant', () => {
      render(<Card variant="outlined">Outlined</Card>)
      const card = screen.getByText('Outlined').parentElement
      expect(card).toHaveClass('border-2')
      expect(card).toHaveClass('border-gray-300')
    })
  })

  describe('Padding', () => {
    it('renders medium padding by default', () => {
      render(<Card>Content</Card>)
      const card = screen.getByText('Content').parentElement
      expect(card).toHaveClass('p-4')
    })

    it('renders with no padding', () => {
      render(<Card padding="none">No padding</Card>)
      const card = screen.getByText('No padding').parentElement
      expect(card).toHaveClass('p-0')
    })

    it('renders with small padding', () => {
      render(<Card padding="small">Small</Card>)
      const card = screen.getByText('Small').parentElement
      expect(card).toHaveClass('p-2')
    })

    it('renders with large padding', () => {
      render(<Card padding="large">Large</Card>)
      const card = screen.getByText('Large').parentElement
      expect(card).toHaveClass('p-6')
    })
  })

  describe('Clickable cards', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Click me</Card>)

      const card = screen.getByText('Click me').parentElement!
      await userEvent.click(card)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies cursor-pointer when clickable', () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Clickable</Card>)

      const card = screen.getByText('Clickable').parentElement
      expect(card).toHaveClass('cursor-pointer')
    })

    it('has button role when clickable', () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Button card</Card>)

      const card = screen.getByRole('button')
      expect(card).toBeInTheDocument()
    })

    it('is keyboard accessible', async () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Keyboard accessible</Card>)

      const card = screen.getByRole('button')

      // Test Enter key
      card.focus()
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)

      // Test Space key
      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('does not have button role when not clickable', () => {
      render(<Card>Not clickable</Card>)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Highlighted state', () => {
    it('applies highlighted styles', () => {
      render(<Card highlighted>Highlighted content</Card>)
      const card = screen.getByText('Highlighted content').parentElement

      expect(card).toHaveClass('border-l-4')
      expect(card).toHaveClass('border-l-blue-500')
    })

    it('does not apply highlighted styles by default', () => {
      render(<Card>Normal content</Card>)
      const card = screen.getByText('Normal content').parentElement

      expect(card).not.toHaveClass('border-l-4')
    })
  })

  describe('Hover effects', () => {
    it('applies hover effects when clickable', () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Hover me</Card>)

      const card = screen.getByText('Hover me').parentElement
      expect(card).toHaveClass('hover:bg-gray-50')
      expect(card).toHaveClass('hover:shadow-lg')
    })

    it('does not apply hover effects when not clickable', () => {
      render(<Card>No hover</Card>)

      const card = screen.getByText('No hover').parentElement
      expect(card).not.toHaveClass('hover:bg-gray-50')
    })
  })

  describe('Custom className', () => {
    it('accepts and applies custom className', () => {
      render(<Card className="custom-class">Custom</Card>)
      const card = screen.getByText('Custom').parentElement

      expect(card).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('is tabbable when clickable', () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Tab to me</Card>)

      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('is not tabbable when not clickable', () => {
      render(<Card>Not tabbable</Card>)

      const card = screen.getByText('Not tabbable').parentElement
      expect(card).not.toHaveAttribute('tabIndex')
    })

    it('has focus ring styles when clickable', () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Focus ring</Card>)

      const card = screen.getByRole('button')
      expect(card).toHaveClass('focus:ring-2')
      expect(card).toHaveClass('focus:ring-blue-500')
    })
  })

  describe('Complex content', () => {
    it('renders complex children', () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Description</p>
          <button>Action</button>
        </Card>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
    })
  })
})
