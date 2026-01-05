import React from 'react'
import logoImage from '../assets/logo.png'

const IPetroLogo = ({ size = 80, className = '' }) => {
  return (
    <div 
      className={className}
      style={{ 
        width: size, 
        height: size, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        position: 'relative'
      }}
    >
      <img 
        src={logoImage}
        alt="IPetro Logo"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          background: 'transparent',
          mixBlendMode: 'multiply',
          filter: 'contrast(1.2) brightness(1.1)',
          WebkitFilter: 'contrast(1.2) brightness(1.1)'
        }}
        onLoad={(e) => {
          // Try to remove grey background using canvas
          const img = e.target
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          // Remove grey/light background pixels (make them transparent)
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const a = data[i + 3]
            
            // Calculate brightness
            const brightness = (r + g + b) / 3
            
            // If pixel is grey/light (background), make it transparent
            // Adjust threshold as needed (200-255 range for light grey)
            if (brightness > 200 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
              data[i + 3] = 0 // Make transparent
            }
          }
          
          ctx.putImageData(imageData, 0, 0)
          img.src = canvas.toDataURL()
        }}
      />
    </div>
  )
}

export default IPetroLogo
