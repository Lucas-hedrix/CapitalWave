import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { useState, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { useUserStore } from './store/useUserStore';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import SupportWidget from './components/support/SupportWidget';
import LandingPage from './pages/LandingPage';
import OnboardingFlow from './pages/OnboardingFlow';
import TradingDashboard from './pages/TradingDashboard';
import PortfolioScreen from './pages/PortfolioScreen';
import Login from './pages/Login';
import Withdraw from './pages/Withdraw';
import Deposit from './pages/Deposit';
import KYC from './pages/KYC';
import Markets from './pages/Markets';
import AdminDashboard from './pages/AdminDashboard';
import AuthGuard from './components/auth/AuthGuard';
import DepositGuard from './components/auth/DepositGuard';
import AdminGuard from './components/auth/AdminGuard';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Lazy load pages for now, or just placeholders if we haven't built them
function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
          {title}
        </h1>
        <p className="mt-4 text-slate-400">Coming soon...</p>
      </div>
    </div>
  );
}

// Layout wrapper for authenticated app pages
function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useUserStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen} 
        isAuthenticated={!!user} 
      />
      
      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={isSidebarOpen} />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full bg-navy relative md:ml-64 transition-all overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <SupportWidget />
    </div>
  );
}

// Layout for public pages (Landing)
function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar 
        toggleSidebar={() => {}} 
        isSidebarOpen={false} 
        isAuthenticated={false} 
      />
      
      <main className="flex-1 w-full bg-navy pt-16 relative">
        <Outlet />
      </main>

      <SupportWidget />
    </div>
  );
}

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Caught by ErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red'}}><h1>Something went wrong.</h1><pre>{this.state.error?.message}</pre></div>;
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#121826',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }} />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingFlow />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<AuthGuard><Outlet /></AuthGuard>}>
            <Route path="/deposit" element={<Deposit />} />
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            </Route>
            <Route element={<DepositGuard><AppLayout /></DepositGuard>}>
              <Route path="/dashboard" element={<TradingDashboard />} />
              <Route path="/portfolio" element={<PortfolioScreen />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/transfer" element={<Withdraw />} />
              <Route path="/settings" element={<Placeholder title="Settings" />} />
              <Route path="/kyc" element={<KYC />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <SpeedInsights />
    </ErrorBoundary>
  );
}
