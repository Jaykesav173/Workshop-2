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
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await authService.login(username, password)
      console.log('Login response:', response)
      if (response.success && response.access_token) {
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.user))
        navigate('/monitoring')
      } else {
        alert('Login failed: ' + (response.message || 'Invalid credentials'))
      }
    } catch (error) {
      console.error('Login failed:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed. Please check your credentials.'
      alert('Login failed: ' + errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">VISOR Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

