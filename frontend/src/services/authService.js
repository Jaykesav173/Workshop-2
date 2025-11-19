/**
 * Authentication Service
 * API service for authentication endpoints
 */
import axios from 'axios'

const API_BASE = "http://127.0.0.1:8000/api"

export const authService = {
  async login(username, password) {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password
    })
    return response.data
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

