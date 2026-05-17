import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  Save, 
  LogOut, 
  Search, 
  Smartphone, 
  Calendar as CalendarIcon, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Phone,
  Printer,
  Trash2,
  Edit,
  Eye,
  X,
  Cpu,
  Palette,
  ShieldAlert,
  Lock,
  Filter
} from 'lucide-react';
import { BRAND_NAME, BRAND_ADDRESS, BRAND_CONTACT } from '../constants';
import { loadData, saveData, StorageKeys, createFullBackup } from '../services/storage';

interface InstallmentDashboardProps {
  onLogout: () => void;
}

type View = 'dashboard' | 'active-plans' | 'completed-plans' | 'add-plan' | 'backup';
type SecurityAction = 'edit' | 'delete' | 'mark_complete';

interface InstallmentPlan {
  id: string;
  customerName: string;
  phoneNumber: string;
  nrcNumber: string;
  address: string;
  
  // Device Details
  deviceModel: string;
  ramRom: string;
  color: string;
  deviceImei: string;
  
  // Financial Details
  price: number; 
  interestAmount: number; 
  documentFee: number;
  totalPrice: number; 
  downPayment: number; 
  remainingAmount: number;
  
  // Plan Details
  planType: 'Monthly Pay' | 'Half Pay';
  months: number;
  startDate: string;
  
  status: 'Active' | 'Completed' | 'Defaulted';
  notes?: string;
  nextPaymentDate: string;
  
  // Schedule
  schedule: { month: number; date: string; amount: number; status: 'Pending' | 'Paid' }[];
}

const DEFAULT_PLANS: InstallmentPlan[] = [
  {
    id: 'INS-1001',
    customerName: 'Ko Kyaw',
    phoneNumber: '09123456789',
    nrcNumber: '12/UKM(N)123456',
    address: 'Htantabin',
    deviceModel: 'Redmi Note 12',
    ramRom: '8/128',
    color: 'Blue',
    deviceImei: '865432109876543',
    price: 600000,
    interestAmount: 60000,
    documentFee: 5000,
    totalPrice: 665000,
    downPayment: 232750,
    remainingAmount: 432250,
    planType: 'Monthly Pay',
    months: 6,
    startDate: '2023-09-15',
    status: 'Active',
    nextPaymentDate: '2023-10-15',
    notes: 'Good payment history',
    schedule: [
       { month: 1, date: '2023-10-15', amount: 72000, status: 'Paid' },
       { month: 2, date: '2023-11-15', amount: 72000, status: 'Pending' },
       { month: 3, date: '2023-12-15', amount: 72000, status: 'Pending' },
       { month: 4, date: '2024-01-15', amount: 72000, status: 'Pending' },
       { month: 5, date: '2024-02-15', amount: 72000, status: 'Pending' },
       { month: 6, date: '2024-03-15', amount: 72250, status: 'Pending' },
    ]
  }
];

export const InstallmentDashboard: React.FC<InstallmentDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [plans, setPlans] = useState<InstallmentPlan[]>(() => 
    loadData(StorageKeys.INSTALLMENTS, DEFAULT_PLANS)
  );

  useEffect(() => {
    saveData(StorageKeys.INSTALLMENTS, plans);
  }, [plans]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Monthly Pay' | 'Half Pay'>('All');
  const [viewingPlan, setViewingPlan] = useState<InstallmentPlan | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Security Modal State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');
  const [securityAction, setSecurityAction] = useState<SecurityAction | null>(null);
  const [securityTargetPlan, setSecurityTargetPlan] = useState<InstallmentPlan | null>(null);
  const [securityError, setSecurityError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    nrcNumber: '',
    address: '',
    
    deviceModel: '',
    ramRom: '',
    color: '',
    deviceImei: '',
    
    price: '', 
    interestAmount: '',
    documentFee: '',
    totalPrice: '',
    downPayment: '',
    remainingAmount: '',
    
    // Monthly Amounts
    month1: '',
    month2: '',
    month3: '',
    month4: '',
    month5: '',
    month6: '',
    
    planType: 'Monthly Pay' as 'Monthly Pay' | 'Half Pay',
    months: '6',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // --- Handlers ---
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    
    const monthsCount = Number(formData.months) || 6;
    const start = new Date(formData.startDate);

    // Generate Schedule based on manual inputs for Month 1-6
    const newSchedule: { month: number; date: string; amount: number; status: 'Pending' }[] = [];
    const monthlyInputs = [formData.month1, formData.month2, formData.month3, formData.month4, formData.month5, formData.month6];
    
    for (let i = 0; i < monthsCount; i++) {
        // Only add if index exists in our manual inputs (0-5 for Month 1-6)
        if (i < 6) {
           const amount = Number(monthlyInputs[i]);
           if (amount > 0) {
              const date = new Date(start);
              date.setMonth(date.getMonth() + (i + 1));
              newSchedule.push({
                  month: i + 1,
                  date: date.toISOString().split('T')[0],
                  amount: amount,
                  status: 'Pending' as const
              });
           }
        }
    }
    
    if (editingPlanId) {
      // Update existing plan
      setPlans(prev => prev.map(p => {
        if (p.id === editingPlanId) {
           return {
             ...p,
             customerName: formData.customerName,
             phoneNumber: formData.phoneNumber,
             nrcNumber: formData.nrcNumber,
             address: formData.address,
             deviceModel: formData.deviceModel,
             ramRom: formData.ramRom,
             color: formData.color,
             deviceImei: formData.deviceImei,
             price: Number(formData.price),
             interestAmount: Number(formData.interestAmount),
             documentFee: Number(formData.documentFee),
             totalPrice: Number(formData.totalPrice),
             downPayment: Number(formData.downPayment),
             remainingAmount: Number(formData.remainingAmount),
             planType: formData.planType,
             months: monthsCount,
             startDate: formData.startDate,
             notes: formData.notes,
             schedule: newSchedule, // Re-generate schedule based on new inputs
             nextPaymentDate: newSchedule.length > 0 ? newSchedule[0].date : p.nextPaymentDate
           };
        }
        return p;
      }));
      alert('Installment Plan Updated Successfully!');
      setEditingPlanId(null);
    } else {
      // Create new plan
      const newPlan: InstallmentPlan = {
        id: `INS-${1000 + plans.length + 1}`,
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        nrcNumber: formData.nrcNumber,
        address: formData.address,
        
        deviceModel: formData.deviceModel,
        ramRom: formData.ramRom,
        color: formData.color,
        deviceImei: formData.deviceImei,
        
        price: Number(formData.price),
        interestAmount: Number(formData.interestAmount),
        documentFee: Number(formData.documentFee),
        totalPrice: Number(formData.totalPrice),
        downPayment: Number(formData.downPayment),
        remainingAmount: Number(formData.remainingAmount),
        
        planType: formData.planType,
        months: monthsCount,
        startDate: formData.startDate,
        
        status: 'Active',
        nextPaymentDate: newSchedule.length > 0 ? newSchedule[0].date : '',
        notes: formData.notes,
        schedule: newSchedule
      };

      setPlans(prev => [newPlan, ...prev]);
      alert('Installment Plan Created Successfully!');
    }
    
    // Reset Form
    setFormData({
      customerName: '',
      phoneNumber: '',
      nrcNumber: '',
      address: '',
      deviceModel: '',
      ramRom: '',
      color: '',
      deviceImei: '',
      price: '',
      interestAmount: '',
      documentFee: '',
      totalPrice: '',
      downPayment: '',
      remainingAmount: '',
      month1: '',
      month2: '',
      month3: '',
      month4: '',
      month5: '',
      month6: '',
      planType: 'Monthly Pay',
      months: '6',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setCurrentView('active-plans');
  };

  // --- Security & Actions ---
  const initiateAction = (action: SecurityAction, plan: InstallmentPlan) => {
    setSecurityAction(action);
    setSecurityTargetPlan(plan);
    setSecurityPassword('');
    setSecurityError('');
    setIsSecurityModalOpen(true);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityPassword === '1471656') {
      setIsSecurityModalOpen(false);
      
      if (!securityTargetPlan) return;

      if (securityAction === 'mark_complete') {
        setPlans(prev => prev.map(p => 
          p.id === securityTargetPlan.id ? { ...p, status: 'Completed' } : p
        ));
      } else if (securityAction === 'delete') {
        setPlans(prev => prev.filter(p => p.id !== securityTargetPlan.id));
      } else if (securityAction === 'edit') {
        setEditingPlanId(securityTargetPlan.id);
        
        // Map schedule amounts back to Month 1-6 inputs
        const m1 = securityTargetPlan.schedule.find(s => s.month === 1)?.amount.toString() || '';
        const m2 = securityTargetPlan.schedule.find(s => s.month === 2)?.amount.toString() || '';
        const m3 = securityTargetPlan.schedule.find(s => s.month === 3)?.amount.toString() || '';
        const m4 = securityTargetPlan.schedule.find(s => s.month === 4)?.amount.toString() || '';
        const m5 = securityTargetPlan.schedule.find(s => s.month === 5)?.amount.toString() || '';
        const m6 = securityTargetPlan.schedule.find(s => s.month === 6)?.amount.toString() || '';

        setFormData({
          customerName: securityTargetPlan.customerName,
          phoneNumber: securityTargetPlan.phoneNumber,
          nrcNumber: securityTargetPlan.nrcNumber,
          address: securityTargetPlan.address,
          deviceModel: securityTargetPlan.deviceModel,
          ramRom: securityTargetPlan.ramRom,
          color: securityTargetPlan.color,
          deviceImei: securityTargetPlan.deviceImei,
          price: securityTargetPlan.price.toString(),
          interestAmount: securityTargetPlan.interestAmount.toString(),
          documentFee: securityTargetPlan.documentFee.toString(),
          totalPrice: securityTargetPlan.totalPrice.toString(),
          downPayment: securityTargetPlan.downPayment.toString(),
          remainingAmount: securityTargetPlan.remainingAmount.toString(),
          month1: m1,
          month2: m2,
          month3: m3,
          month4: m4,
          month5: m5,
          month6: m6,
          planType: securityTargetPlan.planType,
          months: securityTargetPlan.months.toString(),
          startDate: securityTargetPlan.startDate,
          notes: securityTargetPlan.notes || ''
        });
        setCurrentView('add-plan');
      }

      // Reset
      setSecurityAction(null);
      setSecurityTargetPlan(null);
    } else {
      setSecurityError('Incorrect Password');
    }
  };

  const handleExportPlanToPDF = (plan: InstallmentPlan) => {
    const element = document.getElementById('installment-print-content');
    if (element && (window as any).html2pdf) {
      const opt = {
        margin: 0.2,
        filename: `${plan.customerName}_${plan.deviceModel}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      // Temporarily add print class to hide buttons
      element.classList.add('print-mode');
      
      (window as any).html2pdf().set(opt).from(element).save().then(() => {
        element.classList.remove('print-mode');
      });
    } else {
      window.print();
    }
  };

  const handleBackupNow = () => {
    createFullBackup('HHS_INSTALLMENT');
  };

  const handleAutoBackupAndLogout = () => {
    createFullBackup('HHS_INSTALLMENT');
    setTimeout(() => {
      onLogout();
    }, 500);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.installments && Array.isArray(data.installments)) {
          setPlans(data.installments);
          alert('Installment data restored successfully!');
        } else {
          alert('Invalid backup file structure.');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        alert('Error parsing backup file.');
      }
    };
    reader.readAsText(file);
  };

  // --- Filtering ---
  const getFilteredPlans = (status: 'Active' | 'Completed' | 'All') => {
    return plans.filter(plan => {
      const matchesSearch = plan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            plan.phoneNumber.includes(searchTerm) ||
                            plan.deviceModel.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'All' || plan.planType === typeFilter;

      if (status === 'All') return matchesSearch && matchesType;
      if (status === 'Active') return matchesSearch && matchesType && (plan.status === 'Active' || plan.status === 'Defaulted');
      return matchesSearch && matchesType && plan.status === status;
    });
  };

  // --- Calculations ---
  const activePlans = plans.filter(p => p.status === 'Active');
  const activePlansCount = activePlans.length;
  
  const monthlyPayPlans = activePlans.filter(p => p.planType === 'Monthly Pay');
  const monthlyPayCount = monthlyPayPlans.length;
  const monthlyPayRemaining = monthlyPayPlans.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const halfPayPlans = activePlans.filter(p => p.planType === 'Half Pay');
  const halfPayCount = halfPayPlans.length;
  const halfPayRemaining = halfPayPlans.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  
  const totalRemaining = activePlans.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'active-plans', label: 'Active Plans', icon: Clock },
    { id: 'completed-plans', label: 'Completed History', icon: CheckCircle },
    { id: 'add-plan', label: 'New Installment', icon: PlusCircle },
    { id: 'backup', label: 'Data Backup', icon: Save },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Monthly Pay Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <CalendarIcon className="w-24 h-24 text-blue-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Monthly Pay ({monthlyPayCount})</p>
                   <h3 className="text-2xl font-bold text-blue-600 mt-2">{monthlyPayRemaining.toLocaleString()} <span className="text-sm text-slate-400">MMK</span></h3>
                   <span className="text-blue-400 text-xs font-medium mt-1 inline-block">Total Remaining</span>
                </div>

                {/* Half Pay Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <CreditCard className="w-24 h-24 text-purple-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Half Pay ({halfPayCount})</p>
                   <h3 className="text-2xl font-bold text-purple-600 mt-2">{halfPayRemaining.toLocaleString()} <span className="text-sm text-slate-400">MMK</span></h3>
                   <span className="text-purple-400 text-xs font-medium mt-1 inline-block">Total Remaining</span>
                </div>
                
                {/* Total Active Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Users className="w-24 h-24 text-emerald-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Total Active ({activePlansCount})</p>
                   <h3 className="text-2xl font-bold text-emerald-600 mt-2">{totalRemaining.toLocaleString()} <span className="text-sm text-slate-400">MMK</span></h3>
                   <span className="text-emerald-400 text-xs font-medium mt-1 inline-block">Grand Total Remaining</span>
                </div>

                {/* Defaulted Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <AlertCircle className="w-24 h-24 text-red-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Overdue / Defaulted</p>
                   <h3 className="text-2xl font-bold text-red-600 mt-2">{plans.filter(p => p.status === 'Defaulted').length}</h3>
                   <span className="text-red-400 text-xs font-medium mt-1 inline-block">Requires attention</span>
                </div>
             </div>

             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Recent Customers</h3>
                  <button onClick={() => setCurrentView('active-plans')} className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="p-0">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                         <tr>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Device</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Remaining</th>
                            <th className="p-4 text-center">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {plans.slice(0, 5).map(plan => (
                            <tr key={plan.id} className="hover:bg-slate-50">
                               <td className="p-4">
                                  <span className="block font-bold text-slate-800 text-sm">{plan.customerName}</span>
                                  <span className="text-xs text-slate-400">{plan.phoneNumber}</span>
                               </td>
                               <td className="p-4">
                                  <span className="block text-sm text-slate-600 font-medium">{plan.deviceModel}</span>
                                  <span className="text-xs text-slate-400">{plan.ramRom} | {plan.color}</span>
                               </td>
                               <td className="p-4">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${plan.planType === 'Monthly Pay' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                     {plan.planType}
                                  </span>
                               </td>
                               <td className="p-4 font-bold text-slate-700 text-sm">
                                  {plan.remainingAmount.toLocaleString()}
                               </td>
                               <td className="p-4 text-center">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    plan.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                                    plan.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                     {plan.status}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        );

      case 'add-plan':
        return (
          <div className="h-full flex flex-col animate-fade-in max-w-6xl mx-auto w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        {editingPlanId ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{editingPlanId ? 'Edit Installment Plan' : 'Create New Installment Plan'}</h3>
                 </div>
                 {editingPlanId && (
                   <button 
                     onClick={() => { setEditingPlanId(null); setCurrentView('active-plans'); }}
                     className="text-sm text-red-500 font-bold hover:underline"
                   >
                     Cancel Edit
                   </button>
                 )}
              </div>

              <form onSubmit={handleAddPlan} className="p-6 flex-1 overflow-y-auto">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Col: Customer & Device Inputs */}
                    <div className="space-y-6">
                        {/* Customer Section */}
                        <div className="space-y-4">
                           <h4 className="font-bold text-indigo-600 text-sm uppercase tracking-wider border-b border-indigo-100 pb-2 flex items-center gap-2">
                             <User className="w-4 h-4" /> Customer Details
                           </h4>
                           
                           <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                             <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               value={formData.customerName} onChange={e => handleInputChange('customerName', e.target.value)} placeholder="Enter name" />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                  value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} placeholder="09..." />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NRC Number</label>
                                <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                  value={formData.nrcNumber} onChange={e => handleInputChange('nrcNumber', e.target.value)} placeholder="12/..." />
                              </div>
                           </div>

                           <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                             <textarea required rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
                               value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="House No, Street, Quarter..." />
                           </div>
                        </div>

                        {/* Device Section */}
                        <div className="space-y-4">
                           <h4 className="font-bold text-blue-600 text-sm uppercase tracking-wider border-b border-blue-100 pb-2 flex items-center gap-2">
                             <Smartphone className="w-4 h-4" /> Device Info
                           </h4>
                           
                           <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Device Model</label>
                             <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               value={formData.deviceModel} onChange={e => handleInputChange('deviceModel', e.target.value)} placeholder="e.g. iPhone 13 Pro Max" />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RAM & ROM</label>
                                 <div className="relative">
                                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <input type="text" required className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                      value={formData.ramRom} onChange={e => handleInputChange('ramRom', e.target.value)} placeholder="8GB/128GB" />
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color</label>
                                 <div className="relative">
                                    <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <input type="text" required className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                      value={formData.color} onChange={e => handleInputChange('color', e.target.value)} placeholder="Gold" />
                                 </div>
                              </div>
                           </div>
                           
                           <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IMEI Number</label>
                             <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                               value={formData.deviceImei} onChange={e => handleInputChange('deviceImei', e.target.value)} placeholder="Optional" />
                           </div>
                        </div>
                    </div>

                    {/* Right Col: Plan & Financials */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-emerald-600 text-sm uppercase tracking-wider border-b border-emerald-100 pb-2 flex items-center gap-2">
                             <CreditCard className="w-4 h-4" /> Payment Plan Details
                        </h4>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Months)</label>
                                   <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                     value={formData.months} onChange={e => handleInputChange('months', e.target.value)}>
                                      <option value="3">3 Months</option>
                                      <option value="6">6 Months</option>
                                      <option value="9">9 Months</option>
                                      <option value="12">12 Months</option>
                                   </select>
                                </div>
                                <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                   <input type="date" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                     value={formData.startDate} onChange={e => handleInputChange('startDate', e.target.value)} />
                                </div>
                            </div>
                            
                            <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Type</label>
                               <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                 value={formData.planType} onChange={e => handleInputChange('planType', e.target.value)}>
                                  <option value="Monthly Pay">Monthly Pay</option>
                                  <option value="Half Pay">Half Pay</option>
                               </select>
                            </div>

                            <hr className="border-slate-200" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Device Price</label>
                                   <input type="number" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                                     value={formData.price} onChange={e => handleInputChange('price', e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interest 10%</label>
                                   <input type="number" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                                     value={formData.interestAmount} onChange={e => handleInputChange('interestAmount', e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Document Fees</label>
                                   <input type="number" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                                     value={formData.documentFee} onChange={e => handleInputChange('documentFee', e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Price</label>
                                   <input type="number" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-indigo-600"
                                     value={formData.totalPrice} onChange={e => handleInputChange('totalPrice', e.target.value)} placeholder="0" />
                                </div>
                            </div>
                            
                            <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Down Payment 35%</label>
                               <input type="number" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-600"
                                 value={formData.downPayment} onChange={e => handleInputChange('downPayment', e.target.value)} placeholder="0" />
                            </div>

                            <div className="pt-2">
                               <label className="block text-xs font-bold text-indigo-700 uppercase mb-2">Monthly Breakdown (Manual)</label>
                               <div className="grid grid-cols-2 gap-3">
                                  <div>
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">Month 1</span>
                                     <input type="number" className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-medium"
                                     value={formData.month1} onChange={e => handleInputChange('month1', e.target.value)} placeholder="0" />
                                  </div>
                                  <div>
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">Month 2</span>
                                     <input type="number" className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-medium"
                                     value={formData.month2} onChange={e => handleInputChange('month2', e.target.value)} placeholder="0" />
                                  </div>
                                  <div>
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">Month 3</span>
                                     <input type="number" className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-medium"
                                     value={formData.month3} onChange={e => handleInputChange('month3', e.target.value)} placeholder="0" />
                                  </div>
                                  <div>
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">Month 4</span>
                                     <input type="number" className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-medium"
                                     value={formData.month4} onChange={e => handleInputChange('month4', e.target.value)} placeholder="0" />
                                  </div>
                                  <div>
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">Month 5</span>
                                     <input type="number" className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-medium"
                                     value={formData.month5} onChange={e => handleInputChange('month5', e.target.value)} placeholder="0" />
                                  </div>
                                  <div>
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">Month 6</span>
                                     <input type="number" className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-medium"
                                     value={formData.month6} onChange={e => handleInputChange('month6', e.target.value)} placeholder="0" />
                                  </div>
                               </div>
                            </div>
                            
                            <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remaining Amount</label>
                               <input type="number" required className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-bold text-red-600"
                                 value={formData.remainingAmount} onChange={e => handleInputChange('remainingAmount', e.target.value)} placeholder="0" />
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Note Input & Submit */}
                 <div className="mt-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                    <textarea rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none mb-4"
                      value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Additional info..." />
                    
                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                       <Save className="w-5 h-5" /> {editingPlanId ? 'Update' : 'Save'} Installment Plan
                    </button>
                 </div>
              </form>
            </div>
          </div>
        );

      case 'active-plans':
      case 'completed-plans':
        const isActiveView = currentView === 'active-plans';
        const filtered = getFilteredPlans(isActiveView ? 'Active' : 'Completed');
        
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in">
             <div className="p-6 border-b border-slate-100">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                     {isActiveView ? <Clock className="w-5 h-5 text-indigo-600" /> : <CheckCircle className="w-5 h-5 text-indigo-600" />} 
                     {isActiveView ? 'Active Installments' : 'Completed History'}
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search customer..." 
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
               </div>

               {/* Filter Radio Buttons */}
               <div className="mt-4 flex items-center gap-6 animate-fade-in">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter By Type:</span>
                  <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="planType" 
                            checked={typeFilter === 'All'} 
                            onChange={() => setTypeFilter('All')} 
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 transition-all" 
                          />
                          <span className={`text-sm font-medium transition-colors ${typeFilter === 'All' ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-800'}`}>All</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="planType" 
                            checked={typeFilter === 'Monthly Pay'} 
                            onChange={() => setTypeFilter('Monthly Pay')} 
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 transition-all" 
                          />
                          <span className={`text-sm font-medium transition-colors ${typeFilter === 'Monthly Pay' ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-800'}`}>Monthly Pay</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="planType" 
                            checked={typeFilter === 'Half Pay'} 
                            onChange={() => setTypeFilter('Half Pay')} 
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 transition-all" 
                          />
                          <span className={`text-sm font-medium transition-colors ${typeFilter === 'Half Pay' ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-800'}`}>Half Pay</span>
                      </label>
                  </div>
               </div>
             </div>
             
             <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                         <th className="p-4 border-b border-slate-200">Customer</th>
                         <th className="p-4 border-b border-slate-200">Device</th>
                         <th className="p-4 border-b border-slate-200">Payment</th>
                         <th className="p-4 border-b border-slate-200">Progress</th>
                         <th className="p-4 border-b border-slate-200 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filtered.map(plan => (
                         <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                               <div className="font-bold text-slate-800 text-sm">{plan.customerName}</div>
                               <div className="text-xs text-slate-500">{plan.phoneNumber}</div>
                            </td>
                            <td className="p-4">
                               <div className="font-medium text-slate-700 text-sm">{plan.deviceModel}</div>
                               <div className="text-xs text-slate-400">{plan.ramRom} | {plan.color}</div>
                            </td>
                            <td className="p-4">
                               <div className="font-bold text-indigo-600 text-sm">Total: {plan.totalPrice.toLocaleString()} K</div>
                               <div className="text-xs text-slate-500">Remaining: {plan.remainingAmount.toLocaleString()} K</div>
                            </td>
                            <td className="p-4">
                               <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 plan.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                 plan.status === 'Completed' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                               }`}>
                                  {plan.status}
                               </span>
                            </td>
                            <td className="p-4 text-right">
                               <div className="flex justify-end gap-1">
                                  <button onClick={() => setViewingPlan(plan)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details">
                                     <Eye className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => initiateAction('edit', plan)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                     <Edit className="w-4 h-4" />
                                  </button>
                                  {plan.status === 'Active' && (
                                    <button onClick={() => initiateAction('mark_complete', plan)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark Complete">
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button onClick={() => initiateAction('delete', plan)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {filtered.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No plans found.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        );

      case 'backup':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fade-in max-w-4xl mx-auto">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Save className="w-5 h-5 text-indigo-600" /> Backup & Restore
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-300 transition-colors bg-slate-50/50">
                  <button 
                    onClick={handleBackupNow}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Backup Installment Data
                  </button>
              </div>

              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4 hover:border-emerald-300 transition-colors bg-slate-50/50">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImportData}
                    accept="application/json"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" /> Restore Installment Data
                  </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl shadow-slate-200/50">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-display font-bold text-xl text-slate-900">{BRAND_NAME}</h2>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Installment</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto pt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id
                  ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleAutoBackupAndLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">AD</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 relative">
           <div className="fixed top-0 right-0 -z-10 opacity-30 pointer-events-none">
            <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-60 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
           </div>
           {renderContent()}
        </div>
      </main>

      {/* Security Check Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4">
             <div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700">
               <h3 className="text-white font-bold text-lg flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-indigo-400" />
                 Security Check
               </h3>
               <button onClick={() => setIsSecurityModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <form onSubmit={handleSecuritySubmit} className="p-6 space-y-4">
               <p className="text-sm text-slate-500 text-center mb-4">
                 Action: <span className="font-bold text-slate-800 uppercase">{securityAction?.replace('_', ' ')}</span>
                 <br/>
                 Please enter password to confirm.
               </p>
               
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input 
                     type="password"
                     autoFocus
                     required
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold"
                     placeholder="Enter password"
                     value={securityPassword}
                     onChange={e => setSecurityPassword(e.target.value)}
                   />
                 </div>
               </div>

               {securityError && (
                 <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-bold text-center animate-fade-in border border-red-100">
                   {securityError}
                 </div>
               )}

               <div className="pt-2 flex gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsSecurityModalOpen(false)}
                   className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                 >
                   Confirm
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in print:bg-white print:static">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4 max-h-[90vh] flex flex-col print:shadow-none print:w-full print:max-w-none print:rounded-none">
              <div className="p-6 bg-indigo-600 flex justify-between items-center border-b border-indigo-500 shrink-0 print:hidden">
                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Installment Details
                 </h3>
                 <div className="flex gap-2">
                   <button 
                      onClick={() => handleExportPlanToPDF(viewingPlan)} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-all text-xs"
                   >
                      <Printer className="w-4 h-4" /> Print
                   </button>
                   <button onClick={() => setViewingPlan(null)} className="text-white/60 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                   </button>
                 </div>
              </div>
              <div id="installment-print-content" className="p-8 overflow-y-auto">
                 <style>{`
                  @media print {
                     .print-hidden { display: none !important; }
                  }
                  .print-mode .print-hidden { display: none !important; }
                  .print-mode { padding: 40px; }
                `}</style>

                 {/* Header - Visible on Screen and Print */}
                 <div className="text-center mb-8 border-b-2 border-slate-100 pb-6 print:border-slate-800">
                   <h1 className="text-2xl font-display font-bold text-slate-900 uppercase tracking-widest print:text-3xl">Hein Htet San</h1>
                   <p className="text-sm font-bold text-slate-800 mt-2 uppercase tracking-wide print:text-xl">Mobile Phone Sales & Services</p>
                   <p className="text-sm font-bold text-slate-600 mt-1 print:text-lg">09768747313</p>
                   <h2 className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider print:text-lg print:text-slate-500">Installment Plan Details</h2>
                 </div>

                 <div className="mb-6 pb-6 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-900">{viewingPlan.customerName}</h2>
                    <p className="text-slate-500">{viewingPlan.nrcNumber}</p>
                    <p className="text-slate-500 text-sm mt-1">{viewingPlan.address}</p>
                 </div>
                 
                 <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6 print:bg-white print:border-slate-300">
                    <h4 className="font-bold text-indigo-800 text-sm uppercase mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Device Info</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                       <span className="text-slate-500">Model:</span>
                       <span className="font-bold text-slate-800">{viewingPlan.deviceModel}</span>
                       <span className="text-slate-500">Spec:</span>
                       <span className="font-medium text-slate-800">{viewingPlan.ramRom} | {viewingPlan.color}</span>
                       <span className="text-slate-500">IMEI:</span>
                       <span className="font-mono text-slate-700">{viewingPlan.deviceImei || '-'}</span>
                    </div>
                 </div>

                 <div className="space-y-2 text-sm mb-6">
                     <div className="flex justify-between">
                         <span className="text-slate-500">Price:</span>
                         <span className="font-medium">{viewingPlan.price.toLocaleString()} K</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-slate-500">Interest (10%):</span>
                         <span className="font-medium text-red-500">+{viewingPlan.interestAmount.toLocaleString()} K</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-slate-500">Document Fee:</span>
                         <span className="font-medium">+{viewingPlan.documentFee.toLocaleString()} K</span>
                     </div>
                     <div className="flex justify-between border-t border-slate-100 pt-2">
                         <span className="font-bold text-slate-800">Total Price:</span>
                         <span className="font-bold text-indigo-600">{viewingPlan.totalPrice.toLocaleString()} K</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="font-bold text-slate-800">Down Payment (35%):</span>
                         <span className="font-bold text-emerald-600">-{viewingPlan.downPayment.toLocaleString()} K</span>
                     </div>
                     <div className="flex justify-between border-t border-slate-100 pt-2">
                         <span className="font-bold text-slate-800">Remaining Amount:</span>
                         <span className="font-bold text-red-600">{viewingPlan.remainingAmount.toLocaleString()} K</span>
                     </div>
                 </div>

                 <div className="mb-6">
                    <h4 className="font-bold text-slate-500 text-xs uppercase mb-2">Schedule ({viewingPlan.planType})</h4>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden print:bg-white print:border-slate-300">
                       <table className="w-full text-xs text-left">
                           <thead className="bg-slate-100 text-slate-400 print:bg-slate-200 print:text-slate-600">
                               <tr>
                                   <th className="px-4 py-2">Month</th>
                                   <th className="px-4 py-2">Date</th>
                                   <th className="px-4 py-2 text-right">Amount</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                               {viewingPlan.schedule?.map((s, i) => (
                                   <tr key={i}>
                                       <td className="px-4 py-2 font-medium">Month {s.month}</td>
                                       <td className="px-4 py-2 text-slate-500">{s.date}</td>
                                       <td className="px-4 py-2 text-right">{s.amount.toLocaleString()}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                    </div>
                 </div>
                 
                 <div className="flex justify-end print-hidden">
                    <button onClick={() => setViewingPlan(null)} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                       Close
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};