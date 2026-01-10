import React from 'react'

/**
 * Loader Component
 * Displays a loading spinner with a message
 */
function Loader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-600 font-medium">{message}</p>
    </div>
  )
}

export default Loader

