import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/api/authService'
import { STORAGE_KEYS } from '../constants/apiConstants'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Kiểm tra authentication khi component mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const result = await authService.getCurrentUser()
      
      if (result.success) {
        setUser(result.data)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (userData) => {
    try {
      const result = await authService.signUp(userData)
      return result
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        message: 'Sign up failed. Please try again.',
      }
    }
  }

  const signIn = async (credentials) => {
    try {
      const result = await authService.signIn(credentials)
      
      if (result.success && result.data) {
        setUser(result.data.user)
        setIsAuthenticated(true)
      }
      
      return result
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        message: 'Sign in failed. Please try again.',
      }
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/signin'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext