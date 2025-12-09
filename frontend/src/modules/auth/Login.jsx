/**
 * Authentication Module - Haifa
 * Login component
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (!username || !password) {
      setError('Please enter both username and password')
      setLoading(false)
      return
    }
    
    try {
      const response = await authService.login(username, password)
      if (response.success) {
        // Store token and user info
        localStorage.setItem('token', response.access_token)
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user))
          localStorage.setItem('userRole', response.user.role || 'USER')
        }
        
        // Redirect based on user role
        const userRole = response.user?.role?.toUpperCase()
        if (userRole === 'ADMIN') {
          navigate('/admin/dashboard')
        } else if (userRole === 'INSPECTOR') {
          navigate('/inspector/dashboard')
        } else {
          // Default fallback for other roles or no role
          navigate('/reports')
        }
      } else {
        setError(response.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login failed:', error)
      if (error.response) {
        // Server responded with error (401, 403, 500, etc.)
        const errorDetail = error.response.data?.detail || error.response.data?.message
        if (error.response.status === 401) {
          setError(errorDetail || 'Invalid username or password. Please check your credentials.')
        } else if (error.response.status === 403) {
          setError(errorDetail || 'Account is inactive. Please contact administrator.')
        } else {
          setError(errorDetail || `Login failed (${error.response.status}). Please try again.`)
        }
      } else if (error.request) {
        // Request made but no response (backend not running or network issue)
        if (error.code === 'ECONNABORTED') {
          setError('Request timeout - server is not responding. Please check if backend is running.')
        } else {
          setError('Cannot connect to server. Please check if the backend is running.')
        }
      } else {
        // Something else happened
        setError(error.message || 'An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">VISOR Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full p-2 border rounded mb-4 disabled:bg-gray-100"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full p-2 border rounded mb-4 disabled:bg-gray-100"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

