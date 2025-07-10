import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/NotFound";
import ScanConfig from "./pages/ScanConfig";
import ScanResultsHistory from "./pages/ScanResultsHistory";
import ManageUser from "./pages/ManageUser";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
            <Route path="/config" element={ <ProtectedRoute> <ScanConfig /> </ProtectedRoute> } />
            <Route path="/history" element={ <ProtectedRoute> <ScanResultsHistory /> </ProtectedRoute> } />
            <Route path="/manage-users" element={ <ProtectedRoute> <ManageUser /> </ProtectedRoute> } />

            {/* ✅ Redirect / to /login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ✅ Optional: 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
