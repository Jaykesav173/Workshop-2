/**
 * Inspection Module - Main Entry Point
 * Routes to My Inspections page
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Inspection() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/inspection/list', { replace: true })
  }, [navigate])

  return null
}

export default Inspection
