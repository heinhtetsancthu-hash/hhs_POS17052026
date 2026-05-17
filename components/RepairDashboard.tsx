import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { 
  LayoutDashboard, 
  List, 
  Save, 
  LogOut, 
  Search, 
  User, 
  Phone, 
  Smartphone, 
  Cpu, 
  Hash, 
  DollarSign, 
  FileText, 
  Zap, 
  Battery, 
  CreditCard, 
  HardDrive, 
  Download, 
  Upload, 
  PlusCircle,
  Wrench,
  CheckCircle,
  Clock,
  Printer,
  Eye,
  Edit,
  Trash2,
  X,
  XCircle,
  ShieldAlert,
  History,
  Filter,
  TrendingUp,
  CheckSquare,
  AlertCircle,
  MapPin,
  Settings,
  AlertTriangle,
  Camera,
  Share2,
  Lock,
  Unlock,
  Grid3X3,
  FileBarChart
} from 'lucide-react';
import { BRAND_NAME, BRAND_ADDRESS, BRAND_CONTACT } from '../constants';
import { loadData, saveData, StorageKeys, createFullBackup } from '../services/storage';

interface RepairDashboardProps {
  onLogout: () => void;
}

type View = 'new-ticket' | 'ticket-list' | 'backup' | 'settings';
type ListTab = 'pending' | 'completed';
type SecurityAction = 'edit' | 'delete' | 'print';

interface Ticket {
  id: string;
  date: string;
  completedDate?: string;
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  imei: string;
  errorType: string;
  estimatedCost: string;
  finalCost?: string;
  accessories: {
    charger: boolean;
    memoryCard: boolean;
    battery: boolean;
    simCard: boolean;
  };
  screenLock?: {
    type: 'None' | 'Pin' | 'Password' | 'Pattern';
    value: string;
  };
  note: string;
  status: 'Pending' | 'Completed';
  repairOutcome?: 'Successful' | 'Failed';
}

const DEFAULT_TICKETS: Ticket[] = [];

const DEFAULT_ERRORS = [
  "No Power", 
  "USB Port", 
  "FRP", 
  "Global Change", 
  "Battery Replace", 
  "Battery Error", 
  "Glass Replacement",
  "Apple ID",
  "Speaker Error",
  "Earpiece Error",
  "Power Key",
  "Screen Lock Remove"
];

export const RepairDashboard: React.FC<RepairDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('new-ticket');
  const [listTab, setListTab] = useState<ListTab>('pending');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // --- State (Database Connected) ---
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const loaded = loadData(StorageKeys.TICKETS, DEFAULT_TICKETS);
    // Remove duplicates based on ID to fix double list issue
    const uniqueMap = new Map();
    loaded.forEach((t: Ticket) => uniqueMap.set(t.id, t));
    return Array.from(uniqueMap.values());
  });

  const [repairSettings, setRepairSettings] = useState(() => 
    loadData(StorageKeys.REPAIR_SETTINGS, { 
      address: BRAND_ADDRESS, 
      phone: BRAND_CONTACT 
    })
  );

  const [repairErrors, setRepairErrors] = useState<string[]>(() => 
    loadData(StorageKeys.REPAIR_ERRORS, DEFAULT_ERRORS)
  );

  // --- Persistence Effect ---
  useEffect(() => {
    saveData(StorageKeys.TICKETS, tickets);
  }, [tickets]);

  useEffect(() => {
    saveData(StorageKeys.REPAIR_SETTINGS, repairSettings);
  }, [repairSettings]);

  useEffect(() => {
    saveData(StorageKeys.REPAIR_ERRORS, repairErrors);
  }, [repairErrors]);

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    deviceBrand: '',
    deviceModel: '',
    imei: '',
    errorType: '',
    estimatedCost: '',
    accessories: {
      charger: false,
      memoryCard: false,
      battery: false,
      simCard: false
    },
    screenLock: {
      type: 'None' as 'None' | 'Pin' | 'Password' | 'Pattern',
      value: ''
    },
    note: ''
  });

  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editingReturnDateId, setEditingReturnDateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Filtering State
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');

  // --- Modal States ---
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [pendingSecurityAction, setPendingSecurityAction] = useState<{ type: SecurityAction, ticket: Ticket } | null>(null);
  const [serviceActionTicket, setServiceActionTicket] = useState<Ticket | null>(null);
  const [serviceActionCost, setServiceActionCost] = useState('');
  
  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // --- Settings Management States ---
  const [newErrorName, setNewErrorName] = useState('');
  const [editingErrorIndex, setEditingErrorIndex] = useState<number | null>(null);
  const [editingErrorValue, setEditingErrorValue] = useState('');

  // --- Handlers ---
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (accessory: keyof typeof formData.accessories) => {
    setFormData(prev => ({
      ...prev,
      accessories: { ...prev.accessories, [accessory]: !prev.accessories[accessory] }
    }));
  };

  const handlePatternClick = (num: number) => {
    const currentVal = formData.screenLock.value;
    if (currentVal.includes(String(num))) return;
    
    setFormData(prev => ({
      ...prev,
      screenLock: { ...prev.screenLock, value: prev.screenLock.value + num }
    }));
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      phoneNumber: '',
      deviceBrand: '',
      deviceModel: '',
      imei: '',
      errorType: '',
      estimatedCost: '',
      accessories: { charger: false, memoryCard: false, battery: false, simCard: false },
      screenLock: { type: 'None', value: '' },
      note: ''
    });
    setEditingTicketId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTicketId) {
      setTickets(prev => prev.map(t => 
        t.id === editingTicketId ? { ...t, ...formData } : t
      ));
      setEditingTicketId(null);
    } else {
      const existingIds = tickets
        .map(t => parseInt(t.id.replace('T-', '')))
        .filter(n => !isNaN(n));
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      const nextIdNumber = maxId + 1;
      const nextId = `T-${String(nextIdNumber).padStart(5, '0')}`;

      const newTicket: Ticket = {
        id: nextId,
        date: new Date().toISOString().split('T')[0],
        ...formData,
        status: 'Pending'
      };
      setTickets([newTicket, ...tickets]);
    }
    resetForm();
    setCurrentView('ticket-list');
  };

  // --- Settings Handlers ---
  const handleAddError = () => {
    if (newErrorName.trim()) {
      setRepairErrors(prev => [...prev, newErrorName.trim()]);
      setNewErrorName('');
    }
  };

  const handleDeleteError = (index: number) => {
    if (window.confirm("Are you sure you want to delete this error category?")) {
      setRepairErrors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const startEditError = (index: number, currentVal: string) => {
    setEditingErrorIndex(index);
    setEditingErrorValue(currentVal);
  };

  const saveEditError = () => {
    if (editingErrorIndex !== null && editingErrorValue.trim()) {
      setRepairErrors(prev => prev.map((item, i) => i === editingErrorIndex ? editingErrorValue.trim() : item));
      setEditingErrorIndex(null);
      setEditingErrorValue('');
    }
  };

  const cancelEditError = () => {
    setEditingErrorIndex(null);
    setEditingErrorValue('');
  };

  const handleAutoBackupAndLogout = () => {
    createFullBackup('HHS_REPAIR');
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
        let importedTickets: Ticket[] = [];
        
        if (data.tickets && Array.isArray(data.tickets)) {
          importedTickets = data.tickets;
        } else if (Array.isArray(data)) {
          importedTickets = data;
        } else {
          alert('Error: Invalid backup file format for repairs.');
          return;
        }

        const uniqueMap = new Map();
        importedTickets.forEach((t) => uniqueMap.set(t.id, t));
        setTickets(Array.from(uniqueMap.values()));
        
        if (data.repairErrors && Array.isArray(data.repairErrors)) {
           setRepairErrors(data.repairErrors);
        }

        alert('Repair tickets restored successfully!');
      } catch (error) {
        alert('Error: Invalid JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportTicketToPDF = (ticketId: string) => {
    const element = document.getElementById('ticket-receipt-content');
    if (element) {
      const ticket = tickets.find(t => t.id === ticketId);
      const safeName = ticket ? ticket.customerName : 'Ticket';
      
      const opt = {
        margin: 0,
        filename: `${safeName}_${ticketId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
      } as const;
      html2pdf().set(opt).from(element).save();
    }
  };

  const handleScreenshot = async () => {
    if (!viewTicket) return;
    const element = document.getElementById('ticket-receipt-content');
    if (element) {
      try {
        const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = `${viewTicket.customerName}_${viewTicket.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error("Screenshot failed:", error);
        alert("Failed to capture screenshot.");
      }
    }
  };

  const handleShare = async () => {
    if (!viewTicket) return;
    const element = document.getElementById('ticket-receipt-content');
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const fileName = `${viewTicket.customerName}_${viewTicket.id}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });

          if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Repair Voucher',
                text: `Service Voucher for ${viewTicket.customerName} (${viewTicket.id})`
              });
            } catch (shareError) {
              console.log('Share cancelled or failed', shareError);
            }
          } else {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert("Sharing is not supported on this browser/device. Image downloaded instead.");
          }
        }, 'image/png');
      } catch (error) {
        console.error("Share failed:", error);
        alert("Failed to generate share image.");
      }
    }
  };

  const initiateSecurityAction = (type: SecurityAction, ticket: Ticket) => {
    setPendingSecurityAction({ type, ticket });
    setSecurityPassword('');
    setSecurityError('');
    setIsSecurityOpen(true);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityPassword === '1471656') {
      setIsSecurityOpen(false);
      if (pendingSecurityAction) {
        const { type, ticket } = pendingSecurityAction;
        if (type === 'delete') {
          setTickets(prev => prev.filter(t => t.id !== ticket.id));
        } else if (type === 'edit') {
          setEditingTicketId(ticket.id);
          setFormData({
            customerName: ticket.customerName,
            phoneNumber: ticket.phoneNumber,
            deviceBrand: ticket.deviceBrand,
            deviceModel: ticket.deviceModel,
            imei: ticket.imei,
            errorType: ticket.errorType || '',
            estimatedCost: ticket.estimatedCost,
            accessories: { ...ticket.accessories },
            screenLock: ticket.screenLock || { type: 'None', value: '' },
            note: ticket.note
          });
          setCurrentView('new-ticket');
        } else if (type === 'print') {
          setViewTicket(ticket);
          setTimeout(() => exportTicketToPDF(ticket.id), 500);
        }
      }
    } else {
      setSecurityError('Incorrect Password');
    }
  };

  const confirmServiceAction = (outcome: 'Successful' | 'Failed') => {
    if (!serviceActionTicket) return;
    const now = new Date().toISOString().split('T')[0];
    
    let finalCost = serviceActionCost;
    if (outcome === 'Failed') {
      finalCost = '0';
    } else if (!finalCost) {
      finalCost = '0';
    }

    setTickets(prev => prev.map(t => 
      t.id === serviceActionTicket.id 
        ? { ...t, status: 'Completed', repairOutcome: outcome, finalCost: finalCost, completedDate: now } 
        : t
    ));
    setServiceActionTicket(null);
  };

  const updateReturnDate = (ticketId: string, newDate: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, completedDate: newDate } : t
    ));
    setEditingReturnDateId(null);
  };

  // --- Advanced Search & Filtering ---
  const getFilteredTickets = () => {
    return tickets.filter(t => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        t.customerName.toLowerCase().includes(searchLower) ||
        t.id.toLowerCase().includes(searchLower) ||
        t.phoneNumber.includes(searchTerm) ||
        t.deviceBrand.toLowerCase().includes(searchLower) ||
        t.deviceModel.toLowerCase().includes(searchLower) ||
        t.imei.toLowerCase().includes(searchLower) ||
        (t.errorType && t.errorType.toLowerCase().includes(searchLower)); 
      
      const isCompleted = t.finalCost !== undefined && t.finalCost !== '';
      const matchesTab = listTab === 'pending' ? !isCompleted : isCompleted;
      
      if (!matchesSearch || !matchesTab) return false;

      if (dateFilter === 'all') return true;

      const dateToFilter = (listTab === 'completed' && t.completedDate) ? t.completedDate : t.date;
      const [year, month, day] = dateToFilter.split('-').map(Number);
      const ticketDate = new Date(year, month - 1, day);
      const now = new Date();
      now.setHours(0,0,0,0);
      
      switch (dateFilter) {
        case 'today':
          return ticketDate.getTime() === now.getTime();
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return ticketDate.getTime() === yesterday.getTime();
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return ticketDate >= weekAgo;
        case 'month':
          return ticketDate.getMonth() === now.getMonth() && ticketDate.getFullYear() === now.getFullYear();
        case 'custom':
          if (customDateStart && customDateEnd) {
            const start = new Date(customDateStart);
            const end = new Date(customDateEnd);
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            return ticketDate >= start && ticketDate <= end;
          }
          return true;
        default: return true;
      }
    }).sort((a, b) => {
      const dateA = a.completedDate || a.date;
      const dateB = b.completedDate || b.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  };

  const filteredTickets = getFilteredTickets();
  
  const searchResultTotal = filteredTickets.reduce((sum, ticket) => {
    if (ticket.finalCost !== undefined && ticket.finalCost !== '') {
        const cost = parseInt(ticket.finalCost);
        return sum + (isNaN(cost) ? 0 : cost);
    }
    return sum;
  }, 0);

  const pendingCount = tickets.filter(t => !t.finalCost).length;
  const completedCount = tickets.filter(t => t.finalCost !== undefined && t.finalCost !== '').length;

  // --- Report Generation Logic ---
  const reportStats = useMemo(() => {
    const stats: Record<string, { count: number, amount: number }> = {};
    filteredTickets.forEach(t => {
        const category = t.errorType || 'Uncategorized';
        // Use Final Cost if completed, otherwise Estimated Cost for pending tickets report
        const amount = t.finalCost ? parseInt(t.finalCost) : parseInt(t.estimatedCost || '0');
        
        if (!stats[category]) stats[category] = { count: 0, amount: 0 };
        stats[category].count++;
        stats[category].amount += (isNaN(amount) ? 0 : amount);
    });
    return Object.entries(stats).sort((a, b) => b[1].amount - a[1].amount);
  }, [filteredTickets]);

  const exportReportToPDF = () => {
    const element = document.getElementById('repair-category-report-content');
    if (element) {
      const opt = {
        margin: 10,
        filename: `Repair_Summary_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as const;
      
      html2pdf().set(opt).from(element).save();
    }
  };

  const menuItems = [
    { id: 'new-ticket', label: editingTicketId ? 'Edit Ticket' : 'New Ticket', icon: editingTicketId ? Edit : PlusCircle },
    { id: 'ticket-list', label: 'Ticket List', icon: List },
    { id: 'backup', label: 'Data Backup', icon: Save },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl print:hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-display font-bold text-xl text-slate-900">{BRAND_NAME}</h2>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Repair Center</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto pt-6">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { if (item.id === 'new-ticket' && currentView !== 'new-ticket') resetForm(); setCurrentView(item.id as View); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}>
              <item.icon className="w-5 h-5" /> <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleAutoBackupAndLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors">
            <LogOut className="w-5 h-5" /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0 print:hidden">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">AD</div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 print:p-0">
          {currentView === 'new-ticket' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden animate-fade-in">
               <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="font-bold text-slate-800">{editingTicketId ? 'Edit Ticket Details' : 'Open New Ticket'}</h3>
                 <button onClick={() => formRef.current?.requestSubmit()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                   <Save className="w-4 h-4" /> Save
                 </button>
               </div>
               <form ref={formRef} onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                 <div className="space-y-4">
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Customer Name</label>
                     <input type="text" required placeholder="Full Name" value={formData.customerName} onChange={e => handleInputChange('customerName', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                     <input type="text" required placeholder="09..." value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Device Brand</label>
                       <input type="text" required placeholder="Brand" value={formData.deviceBrand} onChange={e => handleInputChange('deviceBrand', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Device Model</label>
                       <input type="text" required placeholder="Model" value={formData.deviceModel} onChange={e => handleInputChange('deviceModel', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                     </div>
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">IMEI (Optional)</label>
                     <input type="text" placeholder="IMEI" value={formData.imei} onChange={e => handleInputChange('imei', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Error</label>
                     <select 
                       value={formData.errorType} 
                       onChange={e => handleInputChange('errorType', e.target.value)} 
                       className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                     >
                       <option value="">Select Error Type</option>
                       {repairErrors.map((error, idx) => (
                         <option key={idx} value={error}>{error}</option>
                       ))}
                     </select>
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estimated Cost</label>
                     <input type="number" required placeholder="Estimated Cost" value={formData.estimatedCost} onChange={e => handleInputChange('estimatedCost', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-indigo-600" />
                   </div>
                 </div>
                 <div className="space-y-4">
                   
                   {/* Screen Lock Section */}
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2"><Lock className="w-3 h-3" /> Screen Lock</p>
                      
                      <div className="flex gap-2 mb-3">
                         {['None', 'Pin', 'Password', 'Pattern'].map((type) => (
                           <button
                             type="button"
                             key={type}
                             onClick={() => setFormData({ ...formData, screenLock: { type: type as any, value: '' } })}
                             className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                               formData.screenLock.type === type 
                                 ? 'bg-indigo-600 text-white border-indigo-600' 
                                 : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                             }`}
                           >
                             {type}
                           </button>
                         ))}
                      </div>

                      {formData.screenLock.type === 'Pin' && (
                        <input 
                          type="text" 
                          placeholder="Enter PIN" 
                          value={formData.screenLock.value} 
                          onChange={(e) => setFormData({ ...formData, screenLock: { ...formData.screenLock, value: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                        />
                      )}

                      {formData.screenLock.type === 'Password' && (
                        <input 
                          type="text" 
                          placeholder="Enter Password" 
                          value={formData.screenLock.value} 
                          onChange={(e) => setFormData({ ...formData, screenLock: { ...formData.screenLock, value: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                        />
                      )}

                      {formData.screenLock.type === 'Pattern' && (
                        <div className="flex flex-col items-center">
                           <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                                const index = formData.screenLock.value.indexOf(String(num));
                                const isSelected = index !== -1;
                                return (
                                  <button
                                    type="button"
                                    key={num}
                                    onClick={() => handlePatternClick(num)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                      isSelected ? 'bg-indigo-600 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isSelected ? index + 1 : ''}
                                  </button>
                                );
                              })}
                           </div>
                           <button 
                             type="button" 
                             onClick={() => setFormData({ ...formData, screenLock: { ...formData.screenLock, value: '' } })} 
                             className="text-xs text-red-500 font-bold mt-2 hover:underline"
                           >
                             Reset Pattern
                           </button>
                        </div>
                      )}
                   </div>

                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Included Accessories</p>
                     <div className="grid grid-cols-2 gap-3">
                        {['charger', 'memoryCard', 'battery', 'simCard'].map(acc => (
                          <label key={acc} className="flex items-center gap-3 text-sm cursor-pointer p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                            <input type="checkbox" checked={formData.accessories[acc as keyof typeof formData.accessories]} onChange={() => handleCheckboxChange(acc as any)} className="w-4 h-4 accent-indigo-600 rounded" />
                            <span className="capitalize text-slate-700 font-medium">{acc.replace(/([A-Z])/g, ' $1')}</span>
                          </label>
                        ))}
                     </div>
                   </div>
                   <div className="space-y-1 h-full">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Service Notes / Faults</label>
                     <textarea placeholder="Service Note / Fault Details" value={formData.note} onChange={e => handleInputChange('note', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none h-24 focus:ring-2 focus:ring-indigo-500" />
                   </div>
                 </div>
               </form>
            </div>
          )}

          {currentView === 'ticket-list' && (
            <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setListTab('pending')} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${listTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-slate-500 hover:text-slate-800'}`}>
                      Pending <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${listTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>{pendingCount}</span>
                    </button>
                    <button onClick={() => setListTab('completed')} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${listTab === 'completed' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-slate-500 hover:text-slate-800'}`}>
                      Completed <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${listTab === 'completed' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>{completedCount}</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setIsReportModalOpen(true)}
                       className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                     >
                        <FileBarChart className="w-4 h-4" /> Report
                     </button>
                     <div className="relative w-full md:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                     </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Filter className="w-4 h-4 text-slate-400" />
                  {['all', 'today', 'yesterday', 'week', 'month', 'custom'].map(f => (
                    <button key={f} onClick={() => setDateFilter(f as any)} className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${dateFilter === f ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-slate-400 hover:text-indigo-600'}`}>
                      {f}
                    </button>
                  ))}
                  {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <input type="date" value={customDateStart} onChange={e => setCustomDateStart(e.target.value)} className="px-2 py-1 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-indigo-400" />
                      <span className="text-slate-400">-</span>
                      <input type="date" value={customDateEnd} onChange={e => setCustomDateEnd(e.target.value)} className="px-2 py-1 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-indigo-400" />
                    </div>
                  )}
                </div>

                {listTab === 'completed' && (
                   <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between animate-fade-in">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Search Income ({filteredTickets.length} Tickets)</p>
                        <p className="text-2xl font-bold text-slate-800">{searchResultTotal.toLocaleString()} <span className="text-xs font-medium text-slate-500">MMK</span></p>
                      </div>
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                      </div>
                   </div>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 sticky top-0 z-10">
                     <tr className="text-[10px] font-bold text-slate-500 uppercase">
                       {listTab === 'completed' ? (
                         <>
                           <th className="p-4">Ticket ID</th>
                           <th className="p-4">Created Date</th>
                           <th className="p-4">Return Date</th>
                           <th className="p-4">Customer</th>
                           <th className="p-4">Device Details</th>
                           <th className="p-4">Note</th>
                           <th className="p-4 text-right">Done Cost</th>
                           <th className="p-4 text-center">Status</th>
                           <th className="p-4 text-right">Actions</th>
                         </>
                       ) : (
                         <>
                           <th className="p-4">Ticket / Date</th>
                           <th className="p-4">Customer</th>
                           <th className="p-4">Device Details</th>
                           <th className="p-4">Note</th>
                           <th className="p-4 text-right">Cost</th>
                           <th className="p-4 text-center">Status</th>
                           <th className="p-4 text-right">Actions</th>
                         </>
                       )}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredTickets.map(t => (
                       <tr key={t.id} className="hover:bg-slate-50 text-sm transition-colors group">
                         {listTab === 'completed' ? (
                           <>
                             <td className="p-4 font-bold text-indigo-600">{t.id}</td>
                             <td className="p-4 text-slate-600">{t.date}</td>
                             <td className="p-4 text-slate-600 font-medium flex items-center gap-2">
                               {editingReturnDateId === t.id ? (
                                 <input 
                                   type="date" 
                                   defaultValue={t.completedDate} 
                                   onBlur={(e) => updateReturnDate(t.id, e.target.value)} 
                                   className="p-1 border rounded"
                                   autoFocus
                                 />
                               ) : (
                                 <>
                                   {t.completedDate || '-'}
                                   <button onClick={() => setEditingReturnDateId(t.id)} className="p-1 text-slate-400 hover:text-indigo-600">
                                     <Edit className="w-3 h-3" />
                                   </button>
                                 </>
                               )}
                             </td>
                             <td className="p-4 font-medium">{t.customerName}<div className="text-[10px] text-slate-400">{t.phoneNumber}</div></td>
                             <td className="p-4">{t.deviceBrand} {t.deviceModel} {t.errorType && <div className="text-[10px] text-red-500 font-bold">{t.errorType}</div>}</td>
                             <td className="p-4 text-slate-600 text-xs truncate max-w-[150px]">{t.note}</td>
                             <td className="p-4 text-right font-bold text-slate-800">{parseInt(t.finalCost || '0').toLocaleString()}</td>
                             <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${t.repairOutcome === 'Successful' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{t.repairOutcome}</span>
                             </td>
                           </>
                         ) : (
                           <>
                             <td className="p-4">
                                <span className="font-bold text-indigo-600">{t.id}</span>
                                <div className="text-[10px] text-slate-400">Created: {t.date}</div>
                             </td>
                             <td className="p-4 font-medium">{t.customerName}<div className="text-[10px] text-slate-400">{t.phoneNumber}</div></td>
                             <td className="p-4">{t.deviceBrand} {t.deviceModel}{t.errorType && <div className="text-[10px] text-red-500 font-bold mt-1">{t.errorType}</div>}<div className="text-[10px] text-slate-400 font-mono">IMEI: {t.imei || '-'}</div></td>
                             <td className="p-4 text-slate-600 text-xs truncate max-w-[150px]">{t.note}</td>
                             <td className="p-4 text-right font-bold text-slate-800">{parseInt(t.estimatedCost).toLocaleString()}</td>
                             <td className="p-4 text-center">
                                <button onClick={() => { setServiceActionTicket(t); setServiceActionCost(t.estimatedCost); }} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold hover:bg-amber-200 transition-colors">Pending</button>
                             </td>
                           </>
                         )}

                         <td className="p-4 text-right">
                           <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setViewTicket(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => initiateSecurityAction('edit', t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => initiateSecurityAction('delete', t)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                           </div>
                         </td>
                       </tr>
                     ))}
                     {filteredTickets.length === 0 && (
                       <tr><td colSpan={listTab === 'completed' ? 8 : 6} className="p-12 text-center text-slate-400 italic">No {listTab} tickets found matching your search.</td></tr>
                     )}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {currentView === 'backup' && (
            <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button onClick={handleAutoBackupAndLogout} className="group p-10 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 hover:bg-white flex flex-col items-center gap-6 transition-all shadow-sm hover:shadow-xl">
                    <div className="p-5 bg-indigo-50 rounded-full text-indigo-600 group-hover:scale-110 transition-transform shadow-sm"><Download className="w-10 h-10" /></div>
                    <div className="text-center">
                      <h3 className="font-bold text-slate-800 text-xl mb-2">Export Data</h3>
                      <p className="text-sm text-slate-400 max-w-xs">Download a secure backup of all repair tickets and records to your device.</p>
                    </div>
                  </button>

                  <button onClick={() => fileInputRef.current?.click()} className="group p-10 border-2 border-dashed border-slate-200 rounded-3xl hover:border-emerald-400 hover:bg-white flex flex-col items-center gap-6 transition-all shadow-sm hover:shadow-xl">
                    <input type="file" ref={fileInputRef} onChange={handleImportData} accept="application/json" className="hidden" />
                    <div className="p-5 bg-emerald-50 rounded-full text-emerald-600 group-hover:scale-110 transition-transform shadow-sm"><Upload className="w-10 h-10" /></div>
                    <div className="text-center">
                      <h3 className="font-bold text-slate-800 text-xl mb-2">Restore Data</h3>
                      <p className="text-sm text-slate-400 max-w-xs">Restore your database from a previously saved backup file. (Warning: This replaces current data)</p>
                    </div>
                  </button>
               </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
              <div className="space-y-6">
                
                {/* Voucher Settings */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <Settings className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl">Voucher Settings</h3>
                  </div>
                  
                  <p className="text-sm text-slate-500 italic">Configure the address and phone number displayed on service vouchers.</p>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Voucher Address</label>
                      <textarea 
                        value={repairSettings.address} 
                        onChange={e => setRepairSettings({...repairSettings, address: e.target.value})} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm font-medium h-24"
                        placeholder="Custom business address..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Voucher Contact Number</label>
                      <input 
                        type="text"
                        value={repairSettings.phone} 
                        onChange={e => setRepairSettings({...repairSettings, phone: e.target.value})} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold font-mono"
                        placeholder="Custom contact number..."
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => { saveData(StorageKeys.REPAIR_SETTINGS, repairSettings); alert('Voucher settings saved!'); }}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      <Save className="w-5 h-5" /> Save Voucher Configuration
                    </button>
                  </div>
                </div>

                {/* Error Categories Settings */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-xl">Error Categories</h3>
                   </div>
                   
                   <p className="text-sm text-slate-500 italic">Manage the dropdown list of errors for new tickets.</p>

                   <div className="space-y-2">
                      {repairErrors.map((error, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-indigo-200 transition-colors">
                           {editingErrorIndex === idx ? (
                             <div className="flex items-center gap-2 w-full">
                                <input 
                                  type="text" 
                                  autoFocus
                                  className="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={editingErrorValue}
                                  onChange={(e) => setEditingErrorValue(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveEditError()}
                                />
                                <button onClick={saveEditError} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={cancelEditError} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                             </div>
                           ) : (
                             <>
                                <span className="font-bold text-slate-700 text-sm">{error}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => startEditError(idx, error)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                   <button onClick={() => handleDeleteError(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             </>
                           )}
                        </div>
                      ))}
                   </div>

                   <div className="pt-4 border-t border-slate-100">
                      <div className="flex gap-2">
                         <input 
                           type="text" 
                           placeholder="Add new error category..." 
                           className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           value={newErrorName}
                           onChange={(e) => setNewErrorName(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAddError()}
                         />
                         <button 
                           onClick={handleAddError}
                           className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
                         >
                           <PlusCircle className="w-4 h-4" /> Add
                         </button>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
           <div className="bg-white w-[210mm] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-slide-up mx-auto h-[90vh]">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <FileBarChart className="w-5 h-5 text-indigo-600" /> Repair Summary Report
                 </h3>
                 <div className="flex gap-2">
                    <button onClick={exportReportToPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm">
                       <Download className="w-4 h-4" /> Export PDF
                    </button>
                    <button onClick={() => setIsReportModalOpen(false)} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
              </div>
              
              <div id="repair-category-report-content" className="p-12 overflow-y-auto bg-white flex-1">
                 <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                    <h1 className="text-3xl font-display font-bold text-slate-900">{BRAND_NAME}</h1>
                    <p className="text-sm font-bold text-slate-600 mt-2">{BRAND_ADDRESS}</p>
                    <h2 className="text-xl font-bold mt-6 uppercase tracking-wider text-slate-800">Repair Category Report</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {listTab === 'completed' ? 'Completed Repairs' : listTab === 'pending' ? 'Pending Repairs' : 'All Repairs'} 
                      {' • '} 
                      Generated on {new Date().toLocaleDateString()}
                    </p>
                 </div>
                 
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b-2 border-slate-200">
                       <th className="py-3 text-sm font-bold text-slate-700 uppercase tracking-wider">Category (Error Type)</th>
                       <th className="py-3 text-sm font-bold text-slate-700 uppercase text-center tracking-wider">Count</th>
                       <th className="py-3 text-sm font-bold text-slate-700 uppercase text-right tracking-wider">Total Amount (MMK)</th>
                     </tr>
                   </thead>
                   <tbody>
                     {reportStats.map(([cat, stat]) => (
                       <tr key={cat} className="border-b border-slate-100 hover:bg-slate-50">
                         <td className="py-4 text-sm font-medium text-slate-800">{cat}</td>
                         <td className="py-4 text-sm text-slate-600 text-center font-bold">{stat.count}</td>
                         <td className="py-4 text-sm font-bold text-indigo-600 text-right">{stat.amount.toLocaleString()}</td>
                       </tr>
                     ))}
                     {reportStats.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic">No data available for this report.</td></tr>
                     )}
                   </tbody>
                   <tfoot>
                      <tr className="border-t-2 border-slate-800 bg-slate-50">
                         <td className="py-4 text-base font-bold text-slate-900 pl-4">Grand Total</td>
                         <td className="py-4 text-base font-bold text-slate-900 text-center">{reportStats.reduce((acc, [, s]) => acc + s.count, 0)}</td>
                         <td className="py-4 text-base font-bold text-slate-900 text-right pr-4">{reportStats.reduce((acc, [, s]) => acc + s.amount, 0).toLocaleString()}</td>
                      </tr>
                   </tfoot>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Security Check */}
      {isSecurityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-slide-up">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold flex items-center gap-2 text-slate-800"><ShieldAlert className="w-5 h-5 text-indigo-500" /> Security Login</h3>
                <button onClick={() => setIsSecurityOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <form onSubmit={handleSecuritySubmit} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Admin Password</label>
                 <input type="password" autoFocus required placeholder="Password" value={securityPassword} onChange={e => setSecurityPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
               </div>
               {securityError && <p className="text-xs text-red-500 text-center font-bold bg-red-50 py-2 rounded-lg border border-red-100">{securityError}</p>}
               <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-colors">Confirm Action</button>
             </form>
          </div>
        </div>
      )}

      {/* Complete Service Action */}
      {serviceActionTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-slide-up">
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="text-2xl font-bold text-slate-900">Finalize Repair</h3>
                 <p className="text-slate-500 text-sm">{serviceActionTicket.deviceBrand} {serviceActionTicket.deviceModel}</p>
               </div>
               <button onClick={() => setServiceActionTicket(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <div className="mb-8">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected Cost (MMK)</label>
               <div className="relative mt-2">
                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input type="number" value={serviceActionCost} onChange={e => setServiceActionCost(e.target.value)} className="w-full text-3xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-5 focus:border-indigo-500 outline-none transition-all text-indigo-700" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => confirmServiceAction('Successful')} className="py-5 bg-indigo-600 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"><CheckCircle className="w-6 h-6" /> <span>Mark Success</span></button>
               <button onClick={() => confirmServiceAction('Failed')} className="py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-200 transition-all"><XCircle className="w-6 h-6" /> <span>Not Repaired</span></button>
             </div>
          </div>
        </div>
      )}

      {/* Ticket Print View */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:static print:bg-white overflow-y-auto animate-fade-in">
          <div className="bg-white w-[148mm] min-h-[210mm] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:max-w-none print:w-[148mm] print:rounded-none print:static animate-slide-up mx-auto">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white"><FileText className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-800">Service Voucher</h3>
                </div>
                <div className="flex gap-2">
                   <button onClick={handleShare} className="px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all" title="Share via Apps"><Share2 className="w-4 h-4" /> Share</button>
                   <button onClick={handleScreenshot} className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-all" title="Save as Image"><Camera className="w-4 h-4" /> Save Img</button>
                   <button onClick={() => exportTicketToPDF(viewTicket.id)} className="px-3 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all"><Printer className="w-4 h-4" /> Print PDF</button>
                   <button onClick={() => setViewTicket(null)} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"><X className="w-5 h-5" /></button>
                </div>
             </div>
             <div id="ticket-receipt-content" className="p-8 bg-white print:p-8 w-[148mm] min-h-[210mm] mx-auto flex flex-col">
                <div className="text-center mb-6 border-b-2 border-slate-900 pb-6">
                  <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-slate-900">{BRAND_NAME}</h1>
                  <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-wide">Mobile Sales & Professional Repair Service</p>
                  <div className="flex justify-center gap-3 mt-2 text-[9px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {repairSettings.address || BRAND_ADDRESS}</span>
                    <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {repairSettings.phone || BRAND_CONTACT}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="space-y-0.5">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer Information</p>
                     <h4 className="text-lg font-bold text-slate-900">{viewTicket.customerName}</h4>
                     <p className="text-slate-600 font-mono font-medium text-[11px]">{viewTicket.phoneNumber}</p>
                   </div>
                   <div className="text-right space-y-0.5">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receipt Details</p>
                     <h4 className="text-lg font-bold text-indigo-600">{viewTicket.id}</h4>
                     <p className="text-slate-600 font-medium text-[11px]">{viewTicket.date}</p>
                   </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 print:bg-white print:border-slate-300">
                   <div className="grid grid-cols-2 gap-y-4">
                      {/* Row 1 */}
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Device Model</p>
                        <p className="text-sm font-bold text-slate-800">{viewTicket.deviceBrand} {viewTicket.deviceModel}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">IMEI / Serial</p>
                        <p className="font-mono font-bold text-slate-600 text-[10px]">{viewTicket.imei || 'Not Specified'}</p>
                      </div>
                      
                      {/* Row 2 */}
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Reported Error</p>
                        <p className="text-sm font-bold text-red-600">{viewTicket.errorType || 'Unspecified'}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Screen Lock {viewTicket.screenLock && viewTicket.screenLock.type !== 'None' ? `(${viewTicket.screenLock.type})` : ''}</p>
                         <p className="text-sm font-bold text-slate-800 font-mono tracking-wider">
                           {viewTicket.screenLock && viewTicket.screenLock.type !== 'None' ? viewTicket.screenLock.value : 'None'}
                         </p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Included Accessories</p>
                        <div className="flex flex-wrap gap-2">
                           {Object.entries(viewTicket.accessories).filter(([_, v]) => v).length > 0 ? (
                             Object.entries(viewTicket.accessories).map(([key, value]) => 
                               value ? (
                                 <div key={key} className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-slate-200">
                                   <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                                   <span className="text-[9px] font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                 </div>
                               ) : null
                             )
                           ) : (
                             <span className="text-[10px] text-slate-400 italic">No accessories included</span>
                           )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Service Faults / Note</p>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl min-h-[60px]">
                          <p className="text-slate-800 leading-relaxed font-medium italic text-xs">{viewTicket.note || 'Standard repair maintenance requested.'}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-2 pt-4 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Repair Cost</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-indigo-700">{parseInt(viewTicket.finalCost || viewTicket.estimatedCost).toLocaleString()}</span>
                          <span className="ml-1 text-[9px] font-bold uppercase opacity-80 text-indigo-700">MMK</span>
                        </div>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-2 p-5 bg-amber-50 rounded-2xl border border-amber-100 text-[9px] text-amber-900 leading-relaxed mt-auto">
                   <p className="font-bold text-amber-950 flex items-center gap-1.5"><AlertCircle className="w-2.5 h-2.5" /> စည်းကမ်းချက်များနှင့် သတိပြုရန် - Terms & Conditions:</p>
                   <ul className="list-decimal pl-5 space-y-1 font-medium">
                     <li>အပ်နှံထားသော Handset ၏ပျက်စီးမှု့အစိတ်အပိုင်းကို ပြုပြင်နေစဥ် အခန့်မသင့်၍ Power ပျောက်ခြင်း စသောအခြား Error များဖြစ်ပေါ်ခဲ့ပါက တာဝန်ယူပေးမည်မဟုတ်၍ နားလည်ပေးပါရန် မေတ္တာ ရပ်ခံအပ်ပါသည်။</li>
                     <li>ပြုပြင်ပြီးသော Handset အား အကြောင်းကြားသည့်နေ့မှစ၍ (၁၀) ရက်အတွင်း လာရောက်ရွေးယူရပါမည်။</li>
                     <li>သတ်မှတ်ရက်ထက် ကျော်လွန်ပါက ပစ္စည်းပျောက်ဆုံး ပျက်စီးမှုအတွက် တာဝန်မယူပါ။</li>
                     <li>အပ်နှံသွားသော Handset ၏ Model တူ/မတူကို ဘောက်ချာဖြတ်ပိုင်းနှင့် တိုက်ဆိုင် စစ်ဆေးပေးပါရန်</li>
                     <li>အပ်နှံထားသော Handset များကို ဘောက်ချာပါမှသာလျှင် ပစ္စည်းထုတ်ပေးပါမည်။</li>
                   </ul>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};