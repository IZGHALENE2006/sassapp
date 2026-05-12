import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import PermissionRoute from "./components/layout/PermissionRoute";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { PERMISSIONS } from "./constants/permissions";
import AppointmentsPage from "./pages/AppointmentsPage";
import DashboardPage from "./pages/DashboardPage";
import DailyRevenueReportPage from "./pages/DailyRevenueReportPage";
import LoginPage from "./pages/LoginPage";
import LegacyPatientsPage from "./pages/LegacyPatientsPage";
import PatientsPage from "./pages/PatientsPage";
import PaymentsPage from "./pages/PaymentsPage";
import QueuePage from "./pages/QueuePage";
import RoleSelectPage from "./pages/RoleSelectPage";

function PrivateLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/choose-role" element={<RoleSelectPage />} />
      <Route
        path="/"
        element={
          <PrivateLayout>
            <PermissionRoute action={PERMISSIONS.DASHBOARD_VIEW}>
              <DashboardPage />
            </PermissionRoute>
          </PrivateLayout>
        }
      />
      <Route
        path="/patients"
        element={
          <PrivateLayout>
            <PermissionRoute action={PERMISSIONS.PATIENT_READ}>
              <PatientsPage />
            </PermissionRoute>
          </PrivateLayout>
        }
      />
      <Route
        path="/legacy-patients"
        element={
          <PrivateLayout>
            <PermissionRoute action={PERMISSIONS.PATIENT_READ}>
              <LegacyPatientsPage />
            </PermissionRoute>
          </PrivateLayout>
        }
      />
      <Route
        path="/queue"
        element={
          <PrivateLayout>
            <PermissionRoute action={PERMISSIONS.QUEUE_READ}>
              <QueuePage />
            </PermissionRoute>
          </PrivateLayout>
        }
      />
      <Route
        path="/appointments"
        element={
          <PrivateLayout>
            <PermissionRoute action={PERMISSIONS.APPOINTMENT_READ}>
              <AppointmentsPage />
            </PermissionRoute>
          </PrivateLayout>
        }
      />
      <Route
        path="/payments"
        element={
          <PrivateLayout>
            <PermissionRoute action={PERMISSIONS.PAYMENT_READ}>
              <PaymentsPage />
            </PermissionRoute>
          </PrivateLayout>
        }
      />
      <Route
        path="/revenue-report"
        element={
          <PrivateLayout>
            <PermissionRoute action={PERMISSIONS.REVENUE_REPORT_READ}>
              <DailyRevenueReportPage />
            </PermissionRoute>
          </PrivateLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
