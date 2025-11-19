/**
 * Button Component Tests
 *
 * Tests for:
 * - Rendering with different variants
 * - Click handling
 * - Disabled state
 * - Loading state
 * - Accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-500')
    })

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-blue-500')
    })

    it('renders danger variant', () => {
      render(<Button variant="danger">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-500')
    })
  })

  describe('Sizes', () => {
    it('renders large size by default', () => {
      render(<Button>Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-14')
    })

    it('renders small size', () => {
      render(<Button size="small">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10')
    })

    it('renders medium size', () => {
      render(<Button size="medium">Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-12')
    })
  })

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('is disabled when loading', () => {
      render(<Button loading>Save</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn()
      render(<Button loading onClick={handleClick}>Loading</Button>)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Type attribute', () => {
    it('renders as button type by default', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('renders as submit type when specified', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('Icon support', () => {
    it('renders icon with text', () => {
      const icon = <span data-testid="icon">🔍</span>
      render(<Button icon={icon}>Search</Button>)

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has focus ring styles', () => {
      render(<Button>Focus me</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:ring-2')
    })

    it('is keyboard accessible', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Button</Button>)

      const button = screen.getByRole('button')
      button.focus()
      fireEvent.keyDown(button, { key: 'Enter' })

      // Note: This tests if the button is focusable
      expect(document.activeElement).toBe(button)
    })
  })

  describe('Custom className', () => {
    it('accepts and applies custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })
})
