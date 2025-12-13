/**
 * App Router
 * Defines all routes for the VISOR application
 */
import { Routes, Route, Navigate } from 'react-router-dom'

// Layout import
import MainLayout from '../components/MainLayout.jsx'

// Module imports
import AuthModule from '../modules/auth/Login.jsx'
import PhotoUploadModule from '../modules/photoUpload/PhotoUpload.jsx'
import InspectionModule from '../modules/inspection/Inspection.jsx'
import MyInspections from '../modules/inspection/MyInspections.jsx'
import NewInspection from '../modules/inspection/NewInspection.jsx'
import InspectionDetails from '../modules/inspection/InspectionDetails.jsx'
import DefectAIModule from '../modules/defectAI/DefectAI.jsx'
import ReportsModule from '../modules/reports/Reports.jsx'
import ValidationModule from '../modules/validation/Validation.jsx'
import MonitoringModule from '../modules/monitoring/Monitoring.jsx'
import EquipmentModule from '../modules/equipment/Equipment.jsx'
import AnalyticsModule from '../modules/analytics/Analytics.jsx'
import AdminDashboard from '../modules/admin/AdminDashboard.jsx'
import InspectorDashboard from '../modules/inspector/InspectorDashboard.jsx'

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthModule />} />
      
      {/* Authenticated Routes with MainLayout */}
      <Route element={<MainLayout />}>
        {/* Dashboard Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/inspector/dashboard" element={<InspectorDashboard />} />
        
        {/* Module Routes */}
        <Route path="/photo-upload" element={<PhotoUploadModule />} />
        <Route path="/inspection" element={<InspectionModule />} />
        <Route path="/inspection/list" element={<MyInspections />} />
        <Route path="/inspection/new" element={<NewInspection />} />
        <Route path="/inspection/:id" element={<InspectionDetails />} />
        <Route path="/defect-ai" element={<DefectAIModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/validation" element={<ValidationModule />} />
        <Route path="/monitoring" element={<MonitoringModule />} />
        <Route path="/equipment" element={<EquipmentModule />} />
        <Route path="/analytics" element={<AnalyticsModule />} />
      </Route>
    </Routes>
  )
}

export default Router
