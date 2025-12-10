import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { store } from "./store/store";

// Layout
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ValidationMonitor from "./pages/ValidationMonitor";
import Analytics from "./pages/Analytics";
import LogsViewer from "./pages/LogsViewer";
import APIMetrics from "./pages/APIMetrics";
import SystemHealth from "./pages/SystemHealth";

// Types
import { UserRole } from "./types/user.types";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
    fontSize: 14,
  },
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes with layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* User management - Admin/Moderator only */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute
                      requiredRoles={[UserRole.ADMIN, UserRole.MODERATOR]}
                    >
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Validation monitoring */}
                <Route path="validation" element={<ValidationMonitor />} />

                {/* Analytics - Admin/Moderator only */}
                <Route
                  path="analytics"
                  element={
                    <ProtectedRoute
                      requiredRoles={[UserRole.ADMIN, UserRole.MODERATOR]}
                    >
                      <Analytics />
                    </ProtectedRoute>
                  }
                />

                {/* Logs viewer */}
                <Route path="logs" element={<LogsViewer />} />

                {/* API metrics */}
                <Route path="api-metrics" element={<APIMetrics />} />

                {/* System health */}
                <Route path="system-health" element={<SystemHealth />} />
              </Route>

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
