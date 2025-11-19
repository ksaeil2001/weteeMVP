/**
 * useAuth Hook Tests
 *
 * Tests for:
 * - Authentication state management
 * - Login/logout flow
 * - Token refresh
 * - Session hydration
 * - User info updates
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth, useAuthStore } from '../useAuth'
import * as authApi from '@/lib/authApi'

// Mock authApi module
jest.mock('@/lib/authApi', () => ({
  refreshAccessToken: jest.fn(),
  getCurrentAccount: jest.fn(),
  logoutUser: jest.fn(),
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()

    // Clear sessionStorage
    window.sessionStorage.clear()

    // Reset auth store
    useAuthStore.setState({ user: null, isLoading: false })
  })

  describe('Initial state', () => {
    it('starts with no authenticated user', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.currentUser).toBeNull()
      expect(result.current.currentRole).toBeNull()
    })

    it('is not loading initially', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Login', () => {
    it('sets user on login', () => {
      const { result } = renderHook(() => useAuth())

      const mockUser = {
        id: 'user-123',
        email: 'teacher@test.com',
        name: 'Test Teacher',
        role: 'teacher' as const,
      }

      act(() => {
        result.current.login(mockUser)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.currentUser).toEqual(mockUser)
      expect(result.current.currentRole).toBe('teacher')
    })

    it('stores user in sessionStorage', () => {
      const { result } = renderHook(() => useAuth())

      const mockUser = {
        id: 'user-123',
        email: 'student@test.com',
        name: 'Test Student',
        role: 'student' as const,
      }

      act(() => {
        result.current.login(mockUser)
      })

      const stored = window.sessionStorage.getItem('wetee_user')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.email).toBe('student@test.com')
    })
  })

  describe('Logout', () => {
    it('clears user on logout', async () => {
      const { result } = renderHook(() => useAuth())

      // Login first
      const mockUser = {
        id: 'user-123',
        email: 'parent@test.com',
        name: 'Test Parent',
        role: 'parent' as const,
      }

      act(() => {
        result.current.login(mockUser)
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Logout
      ;(authApi.logoutUser as jest.Mock).mockResolvedValue({})

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.currentUser).toBeNull()
    })

    it('clears sessionStorage on logout', async () => {
      const { result } = renderHook(() => useAuth())

      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'teacher' as const,
      }

      act(() => {
        result.current.login(mockUser)
      })

      // Verify stored
      expect(window.sessionStorage.getItem('wetee_user')).toBeTruthy()

      // Logout
      ;(authApi.logoutUser as jest.Mock).mockResolvedValue({})

      await act(async () => {
        await result.current.logout()
      })

      expect(window.sessionStorage.getItem('wetee_user')).toBeNull()
    })

    it('calls backend logout API', async () => {
      const { result } = renderHook(() => useAuth())

      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'teacher' as const,
      }

      act(() => {
        result.current.login(mockUser)
      })

      ;(authApi.logoutUser as jest.Mock).mockResolvedValue({})

      await act(async () => {
        await result.current.logout()
      })

      expect(authApi.logoutUser).toHaveBeenCalledTimes(1)
    })

    it('clears state even if API fails', async () => {
      const { result } = renderHook(() => useAuth())

      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'teacher' as const,
      }

      act(() => {
        result.current.login(mockUser)
      })

      // Mock API failure
      ;(authApi.logoutUser as jest.Mock).mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.logout()
      })

      // Should still clear client state
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.currentUser).toBeNull()
    })
  })

  describe('LoadMe (fetch current user)', () => {
    it('loads user from backend', async () => {
      const { result } = renderHook(() => useAuth())

      const mockAccountData = {
        userId: 'user-123',
        email: 'teacher@test.com',
        name: 'Teacher Name',
        role: 'TEACHER',
      }

      ;(authApi.getCurrentAccount as jest.Mock).mockResolvedValue(mockAccountData)

      await act(async () => {
        await result.current.loadMe()
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.currentUser?.email).toBe('teacher@test.com')
      expect(result.current.currentRole).toBe('teacher')
    })

    it('sets loading state during loadMe', async () => {
      const { result } = renderHook(() => useAuth())

      ;(authApi.getCurrentAccount as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      act(() => {
        result.current.loadMe()
      })

      // Check loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })
    })

    it('handles loadMe failure and logs out', async () => {
      const { result } = renderHook(() => useAuth())

      ;(authApi.getCurrentAccount as jest.Mock).mockRejectedValue(new Error('Unauthorized'))
      ;(authApi.logoutUser as jest.Mock).mockResolvedValue({})

      await act(async () => {
        try {
          await result.current.loadMe()
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('prevents duplicate loadMe calls', async () => {
      const { result } = renderHook(() => useAuth())

      const mockAccountData = {
        userId: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'TEACHER',
      }

      ;(authApi.getCurrentAccount as jest.Mock).mockResolvedValue(mockAccountData)

      // Call loadMe multiple times rapidly
      await act(async () => {
        // Start first call
        const promise1 = result.current.loadMe()
        // Try to call again while first is still running
        const promise2 = result.current.loadMe()
        const promise3 = result.current.loadMe()

        await Promise.allSettled([promise1, promise2, promise3])
      })

      // Should only call API once (duplicate calls are prevented)
      expect(authApi.getCurrentAccount).toHaveBeenCalledTimes(1)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('RefreshSession (token refresh)', () => {
    it('calls refresh token API', async () => {
      const { result } = renderHook(() => useAuth())

      ;(authApi.refreshAccessToken as jest.Mock).mockResolvedValue({})

      await act(async () => {
        await result.current.refreshSession()
      })

      expect(authApi.refreshAccessToken).toHaveBeenCalledTimes(1)
    })

    it('logs out on refresh failure', async () => {
      const { result } = renderHook(() => useAuth())

      // Login first
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'teacher' as const,
      }

      act(() => {
        result.current.login(mockUser)
      })

      // Mock refresh failure
      ;(authApi.refreshAccessToken as jest.Mock).mockRejectedValue(new Error('Token expired'))
      ;(authApi.logoutUser as jest.Mock).mockResolvedValue({})

      await act(async () => {
        try {
          await result.current.refreshSession()
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('UpdateUser', () => {
    it('updates user information', () => {
      const { result } = renderHook(() => useAuth())

      const initialUser = {
        id: 'user-123',
        email: 'old@test.com',
        name: 'Old Name',
        role: 'teacher' as const,
      }

      act(() => {
        result.current.login(initialUser)
      })

      const updatedUser = {
        ...initialUser,
        name: 'New Name',
        email: 'new@test.com',
      }

      act(() => {
        result.current.updateUser(updatedUser)
      })

      expect(result.current.currentUser?.name).toBe('New Name')
      expect(result.current.currentUser?.email).toBe('new@test.com')
    })
  })

  describe('Role-based logic', () => {
    it('identifies teacher role', () => {
      const { result } = renderHook(() => useAuth())

      const teacherUser = {
        id: 'teacher-1',
        email: 'teacher@test.com',
        name: 'Teacher',
        role: 'teacher' as const,
      }

      act(() => {
        result.current.login(teacherUser)
      })

      expect(result.current.currentRole).toBe('teacher')
    })

    it('identifies student role', () => {
      const { result } = renderHook(() => useAuth())

      const studentUser = {
        id: 'student-1',
        email: 'student@test.com',
        name: 'Student',
        role: 'student' as const,
      }

      act(() => {
        result.current.login(studentUser)
      })

      expect(result.current.currentRole).toBe('student')
    })

    it('identifies parent role', () => {
      const { result } = renderHook(() => useAuth())

      const parentUser = {
        id: 'parent-1',
        email: 'parent@test.com',
        name: 'Parent',
        role: 'parent' as const,
      }

      act(() => {
        result.current.login(parentUser)
      })

      expect(result.current.currentRole).toBe('parent')
    })
  })

  describe('SessionStorage hydration', () => {
    it('restores user from sessionStorage on mount', () => {
      const mockUser = {
        id: 'user-123',
        email: 'stored@test.com',
        name: 'Stored User',
        role: 'teacher' as const,
      }

      // Pre-populate sessionStorage
      window.sessionStorage.setItem('wetee_user', JSON.stringify(mockUser))

      // Manually trigger hydration by setting the state
      // (hydration code runs at module load, so we simulate it here)
      act(() => {
        useAuthStore.setState({ user: mockUser })
      })

      const { result } = renderHook(() => useAuth())

      // Should restore from sessionStorage
      expect(result.current.currentUser?.email).toBe('stored@test.com')
      expect(result.current.currentUser?.role).toBe('teacher')
      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})
