/**
 * Authentication Service
 * API service for authentication endpoints
 */
import axios from 'axios'
import { API_BASE } from './api.js'

// Create axios instance with timeout
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
})

export const authService = {
  async login(username, password) {
    try {
      console.log('🔵 Frontend: Attempting login for:', username)
      const response = await apiClient.post(`${API_BASE}/auth/login`, {
        username,
        password
      })
      console.log('✅ Frontend: Login successful', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Frontend: Login error', error)
      // Re-throw with more context
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timeout - server is not responding. Please check if backend is running.')
      }
      // Pass through the error so the Login component can show the actual message
      throw error
    }
  },
  
  async register(userData) {
    const response = await axios.post(`${API_BASE}/auth/register`, userData)
    return response.data
  },
  
  async getCurrentUser(token) {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  }
}
