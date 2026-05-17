
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Smartphone, 
  Wrench, 
  Headphones, 
  CreditCard,
  LogOut,
  Printer,
  Package,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Save,
  Search
} from 'lucide-react';
import { BRAND_NAME } from '../constants';
import { loadData, saveData, StorageKeys } from '../services/storage';

interface MonthlyReportDashboardProps {
  onLogout: () => void;
}

type View = 'dashboard' | 'add-report';

export const MonthlyReportDashboard: React.FC<MonthlyReportDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Load Data for Automatic Dashboard
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [repairData, setRepairData] = useState<any[]>([]);
  const [mobileData, setMobileData] = useState<any[]>([]);
  const [accessoryData, setAccessoryData] = useState<any[]>([]);
  const [installmentData, setInstallmentData] = useState<any[]>([]);

  // State for Manual Report Form
  const [reportForm, setReportForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    cashInHand: '',
    brandNewHandset: '',
    secondHandset: '',
    installments: ''
  });

  useEffect(() => {
    setFinanceData(loadData(StorageKeys.TRANSACTIONS, []));
    setRepairData(loadData(StorageKeys.TICKETS, []));
    setMobileData(loadData(StorageKeys.MOBILE_STOCK, []));
    setAccessoryData(loadData(StorageKeys.ACCESSORIES_VOUCHERS, []));
    setInstallmentData(loadData(StorageKeys.INSTALLMENTS, []));
  }, []);

  // Calculations based on selectedMonth
  const calculateMetrics = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    
    const isSameMonth = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
    };

    // 1. Finance
    const financeIncome = financeData
        .filter(t => t.type === 'income' && isSameMonth(t.date))
        .reduce((sum, t) => sum + t.amount, 0);
    const financeExpense = financeData
        .filter(t => t.type === 'expense' && isSameMonth(t.date))
        .reduce((sum, t) => sum + t.amount, 0);

    // 2. Repairs
    const repairRevenue = repairData
        .filter(t => t.status === 'Completed' && isSameMonth(t.completedDate || t.date))
        .reduce((sum, t) => sum + (Number(t.finalCost) || 0), 0);

    // 3. Mobile Sales Breakdown
    const soldItems = mobileData.filter(item => item.status === 'Sold' && isSameMonth(item.soldDate));
    
    const newHandsets = soldItems.filter(item => item.condition === 'New');
    const newHandsetRevenue = newHandsets.reduce((sum, item) => sum + item.sellingPrice, 0);
    const newHandsetCount = newHandsets.length;

    const secondHandHandsets = soldItems.filter(item => item.condition === 'Second Hand');
    const secondHandRevenue = secondHandHandsets.reduce((sum, item) => sum + item.sellingPrice, 0);
    const secondHandCount = secondHandHandsets.length;

    const totalMobileRevenue = newHandsetRevenue + secondHandRevenue;

    // 4. Accessories
    const accessoryRevenue = accessoryData
        .filter(v => v.status !== 'Refunded' && isSameMonth(v.date))
        .reduce((sum, v) => sum + v.totalAmount, 0);

    // 5. Installments
    let installmentRevenue = 0;
    installmentData.forEach(plan => {
        if (plan.schedule) {
            plan.schedule.forEach((s: any) => {
                if (s.status === 'Paid' && isSameMonth(s.date)) {
                    installmentRevenue += s.amount;
                }
            });
        }
        // Add Down Payments & Doc Fees if plan started this month
        if (isSameMonth(plan.startDate)) {
            installmentRevenue += (plan.downPayment || 0);
            installmentRevenue += (plan.documentFee || 0);
        }
    });

    const totalIncome = financeIncome + repairRevenue + totalMobileRevenue + accessoryRevenue + installmentRevenue;
    const cashInHand = totalIncome - financeExpense;

    return {
        financeIncome,
        financeExpense,
        repairRevenue,
        newHandsetRevenue,
        newHandsetCount,
        secondHandRevenue,
        secondHandCount,
        accessoryRevenue,
        installmentRevenue,
        totalIncome,
        cashInHand
    };
  };

  const metrics = calculateMetrics();

  const handlePrint = () => {
    window.print();
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save manual report could go here. 
    // For now, we'll just alert as no storage key was strictly defined for manual reports yet.
    alert("Manual Report Saved (Simulation)");
    setReportForm({
        month: new Date().toISOString().slice(0, 7),
        cashInHand: '',
        brandNewHandset: '',
        secondHandset: '',
        installments: ''
    });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-report', label: 'Add Report', icon: PlusCircle },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl print:hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-display font-bold text-xl text-slate-900">{BRAND_NAME}</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Monthly Report</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto pt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id
                  ? 'bg-slate-900 text-white font-bold shadow-lg shadow-slate-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0 print:hidden">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1>
          
          {currentView === 'dashboard' && (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    />
                </div>
                <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                    <Printer className="w-5 h-5" />
                </button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative print:p-0">
           {currentView === 'dashboard' && (
             <div className="space-y-8 animate-fade-in">
                {/* Print Header */}
                <div className="hidden print:block text-center mb-8 border-b pb-4">
                   <h1 className="text-2xl font-bold text-slate-900">{BRAND_NAME}</h1>
                   <p className="text-sm text-slate-500">Monthly Business Report - {selectedMonth}</p>
                </div>

                {/* 1. Cash in Hand (Main Highlight) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                       <DollarSign className="w-48 h-48 text-indigo-900" />
                    </div>
                    <div className="z-10">
                       <h2 className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-2">Net Cash in Hand</h2>
                       <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-indigo-900">{metrics.cashInHand.toLocaleString()}</span>
                          <span className="text-xl font-medium text-slate-400">MMK</span>
                       </div>
                       <p className="text-sm text-slate-400 mt-2 font-medium">Total Income (All Sources) - Total Expenses</p>
                    </div>
                    <div className="flex gap-4 z-10">
                       <div className="px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                          <p className="text-xs font-bold text-emerald-600 uppercase">Total Income</p>
                          <p className="text-xl font-bold text-emerald-700 mt-1">+{metrics.totalIncome.toLocaleString()}</p>
                       </div>
                       <div className="px-6 py-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                          <p className="text-xs font-bold text-red-600 uppercase">Total Expense</p>
                          <p className="text-xl font-bold text-red-700 mt-1">-{metrics.financeExpense.toLocaleString()}</p>
                       </div>
                    </div>
                </div>

                {/* 2. Breakdown Section */}
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                   <Package className="w-5 h-5 text-indigo-600" /> Detailed Breakdown
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Brand New Handset */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Smartphone className="w-24 h-24 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Brand New Handsets</p>
                            <h3 className="text-2xl font-bold text-slate-800">{metrics.newHandsetRevenue.toLocaleString()} <span className="text-xs text-slate-400">MMK</span></h3>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg text-blue-700 text-xs font-bold">
                               <Smartphone className="w-3 h-3" /> {metrics.newHandsetCount} Units Sold
                            </div>
                        </div>
                    </div>

                    {/* Second Handset */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Smartphone className="w-24 h-24 text-orange-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Second Handsets</p>
                            <h3 className="text-2xl font-bold text-slate-800">{metrics.secondHandRevenue.toLocaleString()} <span className="text-xs text-slate-400">MMK</span></h3>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-lg text-orange-700 text-xs font-bold">
                               <Smartphone className="w-3 h-3" /> {metrics.secondHandCount} Units Sold
                            </div>
                        </div>
                    </div>

                    {/* Installments */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CreditCard className="w-24 h-24 text-purple-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">Installments</p>
                            <h3 className="text-2xl font-bold text-slate-800">{metrics.installmentRevenue.toLocaleString()} <span className="text-xs text-slate-400">MMK</span></h3>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-lg text-purple-700 text-xs font-bold">
                               <Calendar className="w-3 h-3" /> Monthly Collections
                            </div>
                        </div>
                    </div>
                </div>

                {/* Other Income Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Accessories Sales</p>
                            <p className="text-xl font-bold text-slate-800">{metrics.accessoryRevenue.toLocaleString()} MMK</p>
                        </div>
                        <div className="p-3 bg-white rounded-full shadow-sm"><Headphones className="w-5 h-5 text-cyan-600"/></div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Repair Services</p>
                            <p className="text-xl font-bold text-slate-800">{metrics.repairRevenue.toLocaleString()} MMK</p>
                        </div>
                        <div className="p-3 bg-white rounded-full shadow-sm"><Wrench className="w-5 h-5 text-orange-600"/></div>
                    </div>
                </div>
                
                <div className="text-center text-xs text-slate-400 pt-8 print:hidden">
                    Generated at {new Date().toLocaleString()}
                </div>
             </div>
           )}

           {currentView === 'add-report' && (
             <div className="max-w-2xl mx-auto animate-fade-in">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                 <div className="mb-8 pb-6 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800">Add Monthly Report</h2>
                    <p className="text-slate-500 mt-1">Manually record monthly figures for archival purposes.</p>
                 </div>

                 <form onSubmit={handleSaveReport} className="space-y-6">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Report Month</label>
                       <input 
                         type="month" 
                         required
                         value={reportForm.month}
                         onChange={(e) => setReportForm({...reportForm, month: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cash In Hand</label>
                          <div className="relative">
                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="number" 
                               required
                               placeholder="0"
                               value={reportForm.cashInHand}
                               onChange={(e) => setReportForm({...reportForm, cashInHand: e.target.value})}
                               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Installments</label>
                          <div className="relative">
                             <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="number" 
                               required
                               placeholder="0"
                               value={reportForm.installments}
                               onChange={(e) => setReportForm({...reportForm, installments: e.target.value})}
                               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-800"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Brand New Handset</label>
                          <div className="relative">
                             <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="number" 
                               required
                               placeholder="0"
                               value={reportForm.brandNewHandset}
                               onChange={(e) => setReportForm({...reportForm, brandNewHandset: e.target.value})}
                               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Second Handset</label>
                          <div className="relative">
                             <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="number" 
                               required
                               placeholder="0"
                               value={reportForm.secondHandset}
                               onChange={(e) => setReportForm({...reportForm, secondHandset: e.target.value})}
                               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                             />
                          </div>
                       </div>
                    </div>

                    <div className="pt-6">
                       <button 
                         type="submit" 
                         className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                       >
                          <Save className="w-5 h-5" /> Save Manual Report
                       </button>
                    </div>
                 </form>
               </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};
