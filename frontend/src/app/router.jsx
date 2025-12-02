/**
 * App Router
 * Defines all routes for the application
 */
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'

// Layout
import Dashboard from '../components/Dashboard.jsx'

// Module imports
import AuthModule from '../modules/auth/Login.jsx'
import PhotoUploadModule from '../modules/photoUpload/PhotoUpload.jsx'
import InspectionModule from '../modules/inspection/Inspection.jsx'
import DefectAIModule from '../modules/defectAI/DefectAI.jsx'
/**
 * App Router
 * Defines all routes for the application
 */
import EquipmentModule from '../modules/equipment/Equipment.jsx'

function Router() {
  return (
    <EquipmentModule />
  )
}

export default Router
