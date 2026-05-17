
import React, { useState } from 'react';
import { MapPin, Phone, ArrowLeft, ShieldCheck } from 'lucide-react';
import { BRAND_NAME, BRAND_ADDRESS, BRAND_CONTACT, SERVICES } from './constants';
import { ServiceCard } from './components/ServiceCard';
import { ChatWidget } from './components/ChatWidget';
import { LoginView } from './components/LoginView';
import { FinanceDashboard } from './components/FinanceDashboard';
import { RepairDashboard } from './components/RepairDashboard';
import { MobileSalesDashboard } from './components/MobileSalesDashboard';
import { InstallmentDashboard } from './components/InstallmentDashboard';
import { AccessoriesSalesDashboard } from './components/AccessoriesSalesDashboard';
import { MonthlyReportDashboard } from './components/MonthlyReportDashboard';
import { ServiceItem } from './types';

const App: React.FC = () => {
  const [activeService, setActiveService] = useState<ServiceItem | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginConfig, setLoginConfig] = useState({ title: BRAND_NAME, subtitle: 'Portal' });
  const [targetDashboard, setTargetDashboard] = useState<'finance' | 'repair' | 'mobile-sales' | 'installment' | 'accessories' | 'monthly-report' | null>(null);

  const handleServiceClick = (service: ServiceItem) => {
    setTargetDashboard(service.id as any);
    setLoginConfig({ title: BRAND_NAME, subtitle: service.title });
    setShowLogin(true);
  };

  const handleBackFromLogin = () => {
    setShowLogin(false);
    setTargetDashboard(null);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setTargetDashboard(null);
  };

  if (isLoggedIn) {
    if (targetDashboard === 'finance') return <FinanceDashboard onLogout={handleLogout} />;
    if (targetDashboard === 'repair') return <RepairDashboard onLogout={handleLogout} />;
    if (targetDashboard === 'mobile-sales') return <MobileSalesDashboard onLogout={handleLogout} />;
    if (targetDashboard === 'installment') return <InstallmentDashboard onLogout={handleLogout} />;
    if (targetDashboard === 'accessories') return <AccessoriesSalesDashboard onLogout={handleLogout} />;
    if (targetDashboard === 'monthly-report') return <MonthlyReportDashboard onLogout={handleLogout} />;
  }

  const renderContent = () => {
    if (showLogin) {
      return (
        <div className="w-full max-w-md animate-slide-up h-full flex items-center justify-center">
          <LoginView 
            onBack={handleBackFromLogin} 
            onLoginSuccess={handleLoginSuccess} 
            title={loginConfig.title}
            subtitle={loginConfig.subtitle}
          />
        </div>
      );
    }

    return (
      <div className="w-full max-w-5xl animate-slide-up px-4 h-full flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full max-h-full overflow-y-auto no-scrollbar py-8">
          {SERVICES.map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onClick={handleServiceClick} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50 relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex flex-col h-full w-full max-w-6xl mx-auto py-6">
        {!showLogin && (
          <header className="flex flex-col items-center text-center mb-4 animate-fade-in shrink-0">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 tracking-tight">
              {BRAND_NAME}
            </h1>
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              <div className="glass-panel px-4 py-1.5 rounded-full flex items-center gap-2 text-slate-600 shadow-sm text-sm">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">{BRAND_ADDRESS}</span>
              </div>
              <a href={`tel:${BRAND_CONTACT}`} className="glass-panel px-4 py-1.5 rounded-full flex items-center gap-2 text-slate-600 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer shadow-sm group text-sm">
                <Phone className="w-4 h-4 text-indigo-500 group-hover:animate-pulse" />
                <span className="font-mono font-bold">{BRAND_CONTACT}</span>
              </a>
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col justify-center items-center w-full min-h-0 overflow-hidden">
          {renderContent()}
        </main>
      </div>

      <ChatWidget />
    </div>
  );
};

export default App;
