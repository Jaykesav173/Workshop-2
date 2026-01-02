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
import MonitoringModule from '../modules/monitoring/Monitoring.jsx'
import EquipmentModule from '../modules/equipment/Equipment.jsx'
import AnalyticsModule from '../modules/analytics/Analytics.jsx'
import Validation from "../modules/validation/Validation";
import ValidationDetail from "../modules/validation/ValidationDetail";

// Dashboard Components (Refactored)
import AdminDashboardView from '../components/AdminDashboard/AdminDashboardView.jsx'
import { UsersTable } from '../components/AdminDashboard/UsersTable.jsx'
import { SettingsView as AdminSettings } from '../components/AdminDashboard/SettingsView.jsx'

import InspectorDashboardView from '../components/InspectorDashboard/DashboardView.jsx'
import { SettingsView as InspectorSettings } from '../components/InspectorDashboard/SettingsView.jsx'

// Auth recovery routes
import ForgotPassword from "../modules/auth/ForgotPassword.jsx"
import OTPVerification from "../modules/auth/OTPVerification.jsx"
import ResetPassword from "../modules/auth/ResetPassword.jsx"
import Recovered from "../modules/auth/Recovered.jsx"
import { ChangePassword } from "../modules/auth/ChangePassword.jsx"
import CompleteProfile from "../modules/auth/CompleteProfile.jsx"
import SecurityQuestions from "../modules/auth/SecurityQuestions.jsx"

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/validation" replace />} />
      <Route path="/login" element={<AuthModule />} />

      {/* Auth recovery routes */}
      <Route path="/recover/forgot" element={<ForgotPassword />} />
      <Route path="/recover/otp" element={<OTPVerification />} />
      <Route path="/recover/reset" element={<ResetPassword />} />
      <Route path="/recover/done" element={<Recovered />} />
      <Route path="/recover/security-questions" element={<SecurityQuestions />} />

      {/* Change password & profile completion */}
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* Authenticated Routes with MainLayout */}
      <Route element={<MainLayout />}>
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboardView />} />
        <Route path="/admin/users" element={<UsersTable />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Inspector Routes */}
        <Route path="/inspector/dashboard" element={<InspectorDashboardView />} />
        <Route path="/inspector/settings" element={<InspectorSettings />} />

        {/* Module Routes */}
        <Route path="/photo-upload" element={<PhotoUploadModule />} />
        <Route path="/inspection" element={<InspectionModule />} />
        <Route path="/inspection/list" element={<MyInspections />} />
        <Route path="/inspection/new" element={<NewInspection />} />
        <Route path="/inspection/:id" element={<InspectionDetails />} />
        <Route path="/defect-ai" element={<DefectAIModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/monitoring" element={<MonitoringModule />} />
        <Route path="/equipment" element={<EquipmentModule />} />
        <Route path="/analytics" element={<AnalyticsModule />} />

        {/* Validation Module */}
        <Route path="/validation" element={<Validation />} />
        <Route path="/validation/:id" element={<ValidationDetail />} />

        {/* Redirect any unknown routes to login */}
        <Route path="*" element={<Navigate to="/validation" replace />} />
      </Route>
    </Routes>
  );
}

export default Router
