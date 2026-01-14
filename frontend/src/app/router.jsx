/**
 * App Router
 * Defines all routes for the VISOR application
 */
import { Routes, Route, Navigate } from 'react-router-dom'

// Layout import - keep our MainLayout
import MainLayout from '../components/MainLayout.jsx'

// Module imports
import AuthModule from '../modules/auth/Login.jsx'
import PhotoUploadModule from '../modules/Shedule/InspectorShdule.jsx'
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
import EngineerDashboard from '../modules/engineer/EngineerDashboard.jsx'
import UserManagement from '../modules/admin/UserManagement.jsx'
import ReviewInspection from '../modules/review/ReviewInspection.jsx'

// New auth routes from dev-haifa
import ForgotPassword from "../modules/auth/ForgotPassword.jsx"
import OTPVerification from "../modules/auth/OTPVerification.jsx"
import ResetPassword from "../modules/auth/ResetPassword.jsx"
import Recovered from "../modules/auth/Recovered.jsx"
import { ChangePassword } from "../modules/auth/ChangePassword.jsx"
import CompleteProfile from "../modules/auth/CompleteProfile.jsx"

import SecurityQuestions from "../modules/auth/SecurityQuestions.jsx"
import SettingsView from "../components/AdminDashboard/SettingsView.jsx"

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthModule />} />

      {/* Auth recovery routes from dev-haifa */}
      <Route path="/recover/forgot" element={<ForgotPassword />} />
      <Route path="/recover/otp" element={<OTPVerification />} />
      <Route path="/recover/reset" element={<ResetPassword />} />
      <Route path="/recover/done" element={<Recovered />} />
      <Route path="/recover/security-questions" element={<SecurityQuestions />} />

      {/* Change password & profile completion */}
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* Authenticated Routes with MainLayout - keep our structure */}
      <Route element={<MainLayout />}>
        {/* Dashboard Routes - keep our dashboards */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/inspector/dashboard" element={<MonitoringModule />} />
        <Route path="/engineer/dashboard" element={<MonitoringModule />} />

        {/* Module Routes */}
        <Route path="/photo-upload" element={<PhotoUploadModule />} />
        <Route path="/inspection" element={<InspectionModule />} />
        <Route path="/inspection/list" element={<MyInspections />} />
        <Route path="/inspection/new" element={<NewInspection />} />
        <Route path="/inspection/:id" element={<InspectionDetails />} />
        <Route path="/defect-ai" element={<DefectAIModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/reports/:inspectionId" element={<ReportsModule />} />
        <Route path="/validation" element={<ValidationModule />} />
        <Route path="/monitoring" element={<MonitoringModule />} />
        <Route path="/equipment" element={<EquipmentModule />} />
        <Route path="/analytics" element={<AnalyticsModule />} />
        <Route path="/review-inspection" element={<ReviewInspection />} />
        <Route path="/review-inspection/:reportId" element={<ReviewInspection />} />

        {/* Profile Settings */}
        <Route path="/profile" element={<SettingsView />} />
      </Route>
    </Routes>
  )
}

export default Router