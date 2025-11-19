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
import ReportsModule from '../modules/reports/Reports.jsx'
import ValidationModule from '../modules/validation/Validation.jsx'
import MonitoringModule from '../modules/monitoring/Monitoring.jsx'
import EquipmentModule from '../modules/equipment/Equipment.jsx'
import AnalyticsModule from '../modules/analytics/Analytics.jsx'

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthModule />} />
      
      {/* Dashboard routes - wrapped in Dashboard layout */}
      <Route element={<Dashboard />}>
        <Route path="/monitoring" element={<MonitoringModule />} />
        <Route path="/photo-upload" element={<PhotoUploadModule />} />
        <Route path="/inspection" element={<InspectionModule />} />
        <Route path="/defect-ai" element={<DefectAIModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/validation" element={<ValidationModule />} />
        <Route path="/equipment" element={<EquipmentModule />} />
        <Route path="/analytics" element={<AnalyticsModule />} />
      </Route>
    </Routes>
  )
}

export default Router

