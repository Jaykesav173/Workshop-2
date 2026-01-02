/**
 * App Router
 * Defines all routes for the VISOR application
 */
import { Routes, Route, Navigate } from 'react-router-dom'

// Layout import - keep our MainLayout
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
import AdminDashboard from '../modules/admin/AdminDashboard.jsx'
import InspectorDashboard from '../modules/inspector/InspectorDashboard.jsx'
import Validation from "../modules/validation/Validation";
import ValidationDetail from "../modules/validation/ValidationDetail";

// New auth routes from dev-haifa
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
      {/* <Route path="/" element={<Navigate to="/inspector/dashboard" replace />} /> */}
      <Route path="/" element={<Navigate to="/validation" replace />} />
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
        <Route path="/inspector/dashboard" element={<InspectorDashboard />} />

        {/* Module Routes */}
        <Route path="/photo-upload" element={<PhotoUploadModule />} />
        <Route path="/inspection" element={<InspectionModule />} />
        <Route path="/inspection/list" element={<MyInspections />} />
        <Route path="/inspection/new" element={<NewInspection />} />
        <Route path="/inspection/:id" element={<InspectionDetails />} />
        <Route path="/defect-ai" element={<DefectAIModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        {/* Validation Module (Formerly Report Review) */}
        <Route path="/validation" element={<Validation />} />
        <Route path="/validation/:id" element={<ValidationDetail />} />

        

        {/* Redirect any unknown routes to login */}
        <Route path="*" element={<Navigate to="/validation" replace />} />
      </Route>
    </Routes>
  );
}

export default Router
