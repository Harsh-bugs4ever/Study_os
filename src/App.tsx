import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppProvider } from "@/contexts/AppContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import Quiz from "./pages/Quiz";
import Reflect from "./pages/Reflect";
import Social from "./pages/Social";
import Profile from "./pages/Profile";
import MentalHealth from "./pages/MentalHealth";
import Games from "./pages/Games";
import Revision from "./pages/Revision";
import KnowledgeVault from "./pages/KnowledgeVault";
import Journal from "./pages/Journal";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUpload from "./pages/admin/AdminUpload";
import AdminResources from "./pages/admin/AdminResources";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="upload" element={<AdminUpload />} />
                <Route path="resources" element={<AdminResources />} />
              </Route>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/reflect" element={<Reflect />} />
                <Route path="/social" element={<Social />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/mental-health" element={<MentalHealth />} />
                <Route path="/games" element={<Games />} />
                <Route path="/revision" element={<Revision />} />
                <Route path="/knowledge-vault" element={<KnowledgeVault />} />
                <Route path="/journal" element={<Journal />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
