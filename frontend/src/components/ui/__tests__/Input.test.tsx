/**
 * Input Component Tests
 *
 * Tests for:
 * - Text input rendering and changes
 * - Email validation
 * - Password visibility toggle
 * - Error and success states
 * - Character counter
 * - Textarea mode
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'
import { useState } from 'react'

// Wrapper component for controlled input testing
function ControlledInput(props: Partial<React.ComponentProps<typeof Input>>) {
  const [value, setValue] = useState(props.value || '')
  return <Input {...props} value={value} onChange={setValue} />
}

describe('Input Component', () => {
  describe('Basic rendering', () => {
    it('renders text input', () => {
      const handleChange = jest.fn()
      render(<Input value="" onChange={handleChange} placeholder="Enter text" />)

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with label', () => {
      const handleChange = jest.fn()
      render(<Input value="" onChange={handleChange} label="Username" />)

      expect(screen.getByText('Username')).toBeInTheDocument()
    })

    it('shows required indicator', () => {
      const handleChange = jest.fn()
      render(<Input value="" onChange={handleChange} label="Email" required />)

      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('Input types', () => {
    it('renders as text input by default', () => {
      render(<ControlledInput placeholder="Text input" />)
      const input = screen.getByPlaceholderText('Text input')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('renders as email input', () => {
      render(<ControlledInput type="email" placeholder="Email" />)
      const input = screen.getByPlaceholderText('Email')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders as password input', () => {
      render(<ControlledInput type="password" placeholder="Password" />)
      const input = screen.getByPlaceholderText('Password')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders as textarea', () => {
      render(<ControlledInput type="textarea" placeholder="Notes" />)
      const textarea = screen.getByPlaceholderText('Notes')
      expect(textarea.tagName).toBe('TEXTAREA')
    })
  })

  describe('Value changes', () => {
    it('updates value on user input', async () => {
      render(<ControlledInput placeholder="Type here" />)
      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement

      await userEvent.type(input, 'Hello')

      expect(input.value).toBe('Hello')
    })

    it('respects maxLength', async () => {
      render(<ControlledInput maxLength={5} placeholder="Max 5" />)
      const input = screen.getByPlaceholderText('Max 5') as HTMLInputElement

      await userEvent.type(input, '123456789')

      // Should only accept first 5 characters
      expect(input.value).toBe('12345')
      expect(input.value.length).toBe(5)
    })
  })

  describe('Email validation', () => {
    it('shows error for invalid email', async () => {
      render(<ControlledInput type="email" placeholder="Email" />)
      const input = screen.getByPlaceholderText('Email')

      await userEvent.type(input, 'invalid-email')

      expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()
    })

    it('clears error for valid email', async () => {
      render(<ControlledInput type="email" placeholder="Email" />)
      const input = screen.getByPlaceholderText('Email')

      // First type invalid
      await userEvent.type(input, 'invalid')
      expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()

      // Then clear and type valid
      await userEvent.clear(input)
      await userEvent.type(input, 'test@example.com')

      expect(screen.queryByText('올바른 이메일 형식을 입력해주세요')).not.toBeInTheDocument()
    })
  })

  describe('Password visibility toggle', () => {
    it('toggles password visibility', async () => {
      render(<ControlledInput type="password" value="secret123" placeholder="Password" />)
      const input = screen.getByPlaceholderText('Password')
      const toggleButton = screen.getByRole('button')

      // Initially password type
      expect(input).toHaveAttribute('type', 'password')

      // Click toggle
      await userEvent.click(toggleButton)
      expect(input).toHaveAttribute('type', 'text')

      // Click again
      await userEvent.click(toggleButton)
      expect(input).toHaveAttribute('type', 'password')
    })
  })

  describe('Error and success states', () => {
    it('displays error message', () => {
      const handleChange = jest.fn()
      render(<Input value="" onChange={handleChange} error="This field is required" />)

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error styles', () => {
      const handleChange = jest.fn()
      render(<Input value="" onChange={handleChange} error="Error" placeholder="Input" />)
      const input = screen.getByPlaceholderText('Input')

      expect(input).toHaveClass('border-red-500')
    })

    it('shows success checkmark', () => {
      const handleChange = jest.fn()
      const { container } = render(<Input value="valid" onChange={handleChange} success placeholder="Input" />)

      // Success checkmark is rendered as an SVG element
      const checkmark = container.querySelector('svg')
      expect(checkmark).toBeInTheDocument()
      expect(checkmark).toHaveClass('w-5', 'h-5')
    })
  })

  describe('Helper text', () => {
    it('displays helper text', () => {
      const handleChange = jest.fn()
      render(<Input value="" onChange={handleChange} helperText="Enter your email address" />)

      expect(screen.getByText('Enter your email address')).toBeInTheDocument()
    })

    it('hides helper text when error is shown', () => {
      const handleChange = jest.fn()
      render(
        <Input
          value=""
          onChange={handleChange}
          error="Error message"
          helperText="Helper text"
        />
      )

      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    })
  })

  describe('Character counter', () => {
    it('shows character counter', () => {
      const handleChange = jest.fn()
      render(
        <Input
          value="Hello"
          onChange={handleChange}
          maxLength={100}
          showCounter
        />
      )

      expect(screen.getByText('5 / 100')).toBeInTheDocument()
    })

    it('updates counter on input', async () => {
      render(
        <ControlledInput
          maxLength={50}
          showCounter
          placeholder="Type"
        />
      )
      const input = screen.getByPlaceholderText('Type')

      await userEvent.type(input, 'Test')

      expect(screen.getByText('4 / 50')).toBeInTheDocument()
    })
  })

  describe('Disabled state', () => {
    it('disables input', () => {
      const handleChange = jest.fn()
      render(<Input value="" onChange={handleChange} disabled placeholder="Disabled" />)
      const input = screen.getByPlaceholderText('Disabled')

      expect(input).toBeDisabled()
      expect(input).toHaveClass('cursor-not-allowed')
    })
  })

  describe('Textarea mode', () => {
    it('renders textarea with rows', () => {
      const handleChange = jest.fn()
      render(
        <Input
          type="textarea"
          value=""
          onChange={handleChange}
          rows={5}
          placeholder="Notes"
        />
      )
      const textarea = screen.getByPlaceholderText('Notes')

      expect(textarea).toHaveAttribute('rows', '5')
    })
  })
})
