import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Settings, 
  Database, 
  Save, 
  LogOut, 
  Search, 
  Bell,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  X,
  Tag,
  Edit,
  Trash2,
  PlusCircle,
  Check,
  Lock,
  ShieldAlert,
  Upload,
  Download,
  Filter,
  Calendar as CalendarIcon,
  ShoppingBag,
  Smartphone,
  Wallet
} from 'lucide-react';
import { BRAND_NAME } from '../constants';
import { loadData, saveData, StorageKeys, getStorageUsage, createFullBackup } from '../services/storage';

interface FinanceDashboardProps {
  onLogout: () => void;
}

type DashboardView = 'dashboard' | 'transactions' | 'settings' | 'backup' | 'database';
type TransactionType = 'income' | 'expense';
type SecurityActionType = 'edit_category' | 'delete_category' | 'edit_transaction' | 'delete_transaction';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
}

interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
}

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'c1', name: 'Sales', type: 'income' },
    { id: 'c2', name: 'Service', type: 'income' },
    { id: 'inc1', name: 'Adjustment Amount', type: 'income' },
    { id: 'inc4', name: 'Daily Accessories', type: 'income' },
    { id: 'c3', name: 'Rent', type: 'expense' },
    { id: 'c4', name: 'Utilities', type: 'expense' },
    { id: 'c5', name: 'Salary', type: 'expense' },
    { id: 'c6', name: 'Inventory', type: 'expense' },
    { id: 'exp20', name: 'Service Sparepart', type: 'expense' },
    { id: 'exp21', name: 'Buy_Handset', type: 'expense' },
    { id: 'exp26', name: 'Accessories Company', type: 'expense' },
];

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    loadData(StorageKeys.TRANSACTIONS, DEFAULT_TRANSACTIONS)
  );

  const [categories, setCategories] = useState<Category[]>(() => 
    loadData(StorageKeys.CATEGORIES, DEFAULT_CATEGORIES)
  );

  const [mobileStock] = useState<any[]>(() => loadData(StorageKeys.MOBILE_STOCK, []));
  const [tickets] = useState<any[]>(() => loadData(StorageKeys.TICKETS, []));
  const [installments] = useState<any[]>(() => loadData(StorageKeys.INSTALLMENTS, []));

  useEffect(() => {
    saveData(StorageKeys.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    saveData(StorageKeys.CATEGORIES, categories);
  }, [categories]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalType, setModalType] = useState<TransactionType>('income');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    newCategory: ''
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'income' as TransactionType | 'both'
  });

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<SecurityActionType | null>(null);
  const [securityTargetCategory, setSecurityTargetCategory] = useState<Category | null>(null);
  const [securityTargetTransaction, setSecurityTargetTransaction] = useState<Transaction | null>(null);
  const [securityPassword, setSecurityPassword] = useState('');
  const [securityError, setSecurityError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = t.category.toLowerCase().includes(searchLower) || 
                            t.note.toLowerCase().includes(searchLower) ||
                            t.amount.toString().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Category Filter
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;

      const [year, month, day] = t.date.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);
      const now = new Date();
      
      const isSameDate = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
      };

      switch (dateFilter) {
        case 'today':
          return isSameDate(targetDate, now);
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return isSameDate(targetDate, yesterday);
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          weekAgo.setHours(0,0,0,0);
          return targetDate >= weekAgo && targetDate <= now;
        case 'month':
          return targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear();
        case 'custom':
          if (customDateStart && customDateEnd) {
            const start = new Date(customDateStart);
            start.setHours(0,0,0,0);
            const end = new Date(customDateEnd);
            end.setHours(23,59,59,999);
            return targetDate >= start && targetDate <= end;
          }
          return true;
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleExportData = () => {
    createFullBackup('HHS_FINANCE');
  };

  const handleAutoBackupAndLogout = () => {
    createFullBackup('HHS_FINANCE');
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
        if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
        alert('Data restored successfully!');
      } catch (error) {
        alert('Error: Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenModal = (type: TransactionType) => {
    setModalType(type);
    setEditingTransaction(null);
    setFormData({
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      newCategory: ''
    });
    setIsCustomCategory(false);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    let finalCategory = formData.category;

    if (isCustomCategory && formData.newCategory.trim()) {
      const newCat: Category = {
        id: Date.now().toString() + 'cat',
        name: formData.newCategory.trim(),
        type: modalType
      };
      setCategories(prev => [...prev, newCat]);
      finalCategory = newCat.name;
    } else if (!finalCategory) {
      alert("Please select or create a category");
      return;
    }

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id 
          ? { ...t, type: modalType, amount: parseFloat(formData.amount), category: finalCategory, date: formData.date, note: formData.note }
          : t
      ));
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: modalType,
        amount: parseFloat(formData.amount),
        category: finalCategory,
        date: formData.date,
        note: formData.note
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityPassword === '1471656') {
       setIsSecurityModalOpen(false);
       if (securityAction === 'delete_category' && securityTargetCategory) {
          setCategories(prev => prev.filter(c => c.id !== securityTargetCategory.id));
       } else if (securityAction === 'edit_category' && securityTargetCategory) {
          setEditingCategory(securityTargetCategory);
          setCategoryFormData({ name: securityTargetCategory.name, type: securityTargetCategory.type });
          setIsCategoryModalOpen(true);
       } else if (securityAction === 'delete_transaction' && securityTargetTransaction) {
          setTransactions(prev => prev.filter(t => t.id !== securityTargetTransaction.id));
       } else if (securityAction === 'edit_transaction' && securityTargetTransaction) {
          setEditingTransaction(securityTargetTransaction);
          setModalType(securityTargetTransaction.type);
          setFormData({ amount: securityTargetTransaction.amount.toString(), category: securityTargetTransaction.category, date: securityTargetTransaction.date, note: securityTargetTransaction.note, newCategory: '' });
          setIsModalOpen(true);
       }
       setSecurityAction(null);
       setSecurityTargetCategory(null);
       setSecurityTargetTransaction(null);
       setSecurityPassword('');
    } else {
       setSecurityError('Incorrect Password');
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: categoryFormData.name, type: categoryFormData.type } : c ));
    } else {
      const newCat: Category = { id: Date.now().toString() + 'cat', name: categoryFormData.name, type: categoryFormData.type };
      setCategories(prev => [...prev, newCat]);
    }
    setIsCategoryModalOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'backup', label: 'Data Backup', icon: Save },
    { id: 'database', label: 'Local Database', icon: Database },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-slate-800" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Balance</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalBalance.toLocaleString()} MMK</h3>
                <span className="text-indigo-500 text-sm font-medium mt-2 inline-flex items-center gap-1">Available Cash</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-emerald-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Income</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-2">{totalIncome.toLocaleString()} MMK</h3>
                <div className="mt-4"><button onClick={() => handleOpenModal('income')} className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Income</button></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingDown className="w-24 h-24 text-red-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Expenses</p>
                <h3 className="text-3xl font-bold text-red-600 mt-2">{totalExpense.toLocaleString()} MMK</h3>
                <div className="mt-4"><button onClick={() => handleOpenModal('expense')} className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"><Minus className="w-4 h-4" /> Add Expense</button></div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Recent Activity</h3>
                <button onClick={() => setCurrentView('transactions')} className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}</div>
                      <div><p className="font-bold text-slate-800">{t.category}</p><p className="text-xs text-slate-400">{t.date} • {t.note}</p></div>
                    </div>
                    <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} MMK</span>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-center text-slate-400 py-8">No transactions yet.</p>}
              </div>
            </div>
          </div>
        );
      case 'transactions':
        const filtered = getFilteredTransactions();
        
        // --- Calculate Search Results Summary ---
        const filteredIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const filteredExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const filteredNet = filteredIncome - filteredExpense;

        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Transaction History</h3>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-col gap-4 bg-slate-50 p-3 rounded-xl">
                 <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        {['all', 'today', 'yesterday', 'week', 'month', 'custom'].map(filter => (
                          <button key={filter} onClick={() => setDateFilter(filter as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${dateFilter === filter ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'}`}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</button>
                        ))}
                     </div>
                     
                     <div className="flex items-center gap-2 w-full md:w-auto">
                        <select 
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full md:w-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="All">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                     </div>
                 </div>

                 {dateFilter === 'custom' && (
                   <div className="flex items-center gap-2 w-full justify-end animate-fade-in border-t border-slate-200 pt-3">
                     <span className="text-xs font-bold text-slate-400 uppercase">Range:</span>
                     <input type="date" value={customDateStart} onChange={(e) => setCustomDateStart(e.target.value)} className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                     <span className="text-slate-400">-</span>
                     <input type="date" value={customDateEnd} onChange={(e) => setCustomDateEnd(e.target.value)} className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                   </div>
                 )}
              </div>

              {/* Search Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Search Income</p>
                       <p className="text-xl font-bold text-slate-800">{filteredIncome.toLocaleString()} <span className="text-[10px] text-slate-500">MMK</span></p>
                    </div>
                    <div className="p-2 bg-white rounded-full shadow-sm"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
                 </div>
                 
                 <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Search Expense</p>
                       <p className="text-xl font-bold text-slate-800">{filteredExpense.toLocaleString()} <span className="text-[10px] text-slate-500">MMK</span></p>
                    </div>
                    <div className="p-2 bg-white rounded-full shadow-sm"><TrendingDown className="w-5 h-5 text-red-500" /></div>
                 </div>

                 <div className={`p-4 rounded-xl border flex items-center justify-between ${filteredNet >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div>
                       <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${filteredNet >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>Search Net Balance</p>
                       <p className="text-xl font-bold text-slate-800">{filteredNet.toLocaleString()} <span className="text-[10px] text-slate-500">MMK</span></p>
                    </div>
                    <div className="p-2 bg-white rounded-full shadow-sm"><Wallet className={`w-5 h-5 ${filteredNet >= 0 ? 'text-indigo-500' : 'text-amber-500'}`} /></div>
                 </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-slate-400 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4">Date</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Note</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 group">
                      <td className="p-4 text-slate-600 text-sm">{t.date}</td>
                      <td className="p-4"><span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold">{t.category}</span></td>
                      <td className="p-4 text-slate-500 text-sm italic">{t.note || '-'}</td>
                      <td className={`p-4 font-bold text-right text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}</td>
                      <td className="p-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => initiateTransactionEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => initiateTransactionDelete(t)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No search results found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'settings':
        const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both');
        const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-6"><div><h3 className="font-bold text-slate-800 text-lg">Categories</h3><p className="text-slate-500 text-sm">Manage business categories</p></div><button onClick={() => { setEditingCategory(null); setCategoryFormData({ name: '', type: 'income' }); setIsCategoryModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Add Category</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div><h4 className="font-bold text-emerald-600 border-b border-emerald-100 pb-2 mb-4">Income Categories</h4><div className="space-y-2">{incomeCategories.map(c => (
                <div key={c.id} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 group"><span className="font-bold text-slate-700 text-sm">{c.name}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => { setSecurityAction('edit_category'); setSecurityTargetCategory(c); setIsSecurityModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button><button onClick={() => { setSecurityAction('delete_category'); setSecurityTargetCategory(c); setIsSecurityModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></div>
              ))}</div></div>
              <div><h4 className="font-bold text-red-600 border-b border-red-100 pb-2 mb-4">Expense Categories</h4><div className="space-y-2">{expenseCategories.map(c => (
                <div key={c.id} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 group"><span className="font-bold text-slate-700 text-sm">{c.name}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => { setSecurityAction('edit_category'); setSecurityTargetCategory(c); setIsSecurityModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button><button onClick={() => { setSecurityAction('delete_category'); setSecurityTargetCategory(c); setIsSecurityModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></div>
              ))}</div></div>
            </div>
          </div>
        );
      case 'backup':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm animate-fade-in max-w-4xl mx-auto">
            <h3 className="font-bold text-slate-800 mb-8">System Backup & Restore</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50 hover:border-indigo-300 transition-colors"><div className="p-4 bg-white rounded-full shadow-sm w-fit mx-auto mb-4"><Download className="w-8 h-8 text-indigo-500" /></div><h4 className="font-bold text-slate-700">Export All Data</h4><button onClick={handleExportData} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mx-auto"><Save className="w-5 h-5" /> Download Backup</button></div>
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50 hover:border-emerald-300 transition-colors"><div className="p-4 bg-white rounded-full shadow-sm w-fit mx-auto mb-4"><Upload className="w-8 h-8 text-emerald-500" /></div><h4 className="font-bold text-slate-700">Restore from File</h4><input type="file" ref={fileInputRef} onChange={handleImportData} accept="application/json" className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mx-auto"><Upload className="w-5 h-5" /> Select File</button></div>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
            <h3 className="font-bold text-slate-800 mb-6">Local Database Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 uppercase font-bold">Transactions</p><p className="text-2xl font-bold text-slate-800">{transactions.length}</p></div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 uppercase font-bold">Categories</p><p className="text-2xl font-bold text-slate-800">{categories.length}</p></div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 uppercase font-bold">Storage Usage</p><p className="text-2xl font-bold text-slate-800">{getStorageUsage()}</p></div>
            </div>
          </div>
        );
    }
  };

  const initiateTransactionEdit = (t: Transaction) => { setSecurityAction('edit_transaction'); setSecurityTargetTransaction(t); setIsSecurityModalOpen(true); };
  const initiateTransactionDelete = (t: Transaction) => { setSecurityAction('delete_transaction'); setSecurityTargetTransaction(t); setIsSecurityModalOpen(true); };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl shadow-slate-200/50">
        <div className="p-6 border-b border-slate-100"><h2 className="font-display font-bold text-xl text-slate-900">{BRAND_NAME}</h2><p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Finance</p></div>
        <div className="p-4 space-y-3"><button onClick={() => handleOpenModal('income')} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm"><Plus className="w-5 h-5" /> Add Income</button><button onClick={() => handleOpenModal('expense')} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-sm"><Minus className="w-5 h-5" /> Add Expense</button></div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto pt-0">{menuItems.map((item) => (
            <button key={item.id} onClick={() => setCurrentView(item.id as DashboardView)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}><item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`} /><span>{item.label}</span></button>
        ))}</nav>
        <div className="p-4 border-t border-slate-100"><button onClick={handleAutoBackupAndLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"><LogOut className="w-5 h-5" /><span>Sign Out</span></button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0"><h1 className="text-xl font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1><div className="flex items-center gap-4"><div className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search categories, notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-indigo-500 w-64 transition-all" /></div><div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">AD</div></div></header>
        <div className="flex-1 overflow-y-auto p-8 relative">{renderContent()}</div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in"><div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4"><div className={`p-6 flex justify-between items-center ${modalType === 'income' ? 'bg-emerald-600' : 'bg-red-600'}`}><h3 className="text-white font-bold text-lg flex items-center gap-2">{modalType === 'income' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}{editingTransaction ? 'Edit' : 'Add'} {modalType === 'income' ? 'Income' : 'Expense'}</h3><button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button></div><form onSubmit={handleSaveTransaction} className="p-6 space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label><input type="number" required step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-xl" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>{!isCustomCategory ? (<select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 appearance-none" value={formData.category} onChange={e => { if (e.target.value === 'custom') { setIsCustomCategory(true); setFormData({...formData, category: ''}); } else { setFormData({...formData, category: e.target.value}); } }}><option value="">Select Category</option>{categories.filter(c => c.type === modalType || c.type === 'both').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="custom" className="font-bold text-indigo-600">+ Create Custom</option></select>) : (<div className="flex gap-2"><input type="text" autoFocus placeholder="Category name" className="flex-1 px-4 py-3 bg-slate-50 border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.newCategory} onChange={e => setFormData({...formData, newCategory: e.target.value})} /><button type="button" onClick={() => setIsCustomCategory(false)} className="p-3 text-slate-500 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button></div>)}</div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label><input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note</label><textarea rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Description..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div><button type="submit" className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg ${modalType === 'income' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-red-600 shadow-red-200'}`}>{editingTransaction ? 'Update' : 'Save'} Transaction</button></form></div></div>
      )}

      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in"><div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4"><div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700"><h3 className="text-white font-bold text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-indigo-400" />Security Check</h3><button onClick={() => setIsSecurityModalOpen(false)} className="text-white/60 hover:text-white"><X className="w-6 h-6" /></button></div><form onSubmit={handleSecuritySubmit} className="p-6 space-y-4"><p className="text-sm text-slate-500 text-center mb-4">Enter password to confirm sensitive action.</p><input type="password" autoFocus required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Password" value={securityPassword} onChange={e => setSecurityPassword(e.target.value)} />{securityError && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-bold text-center border border-red-100">{securityError}</div>}<div className="pt-2 flex gap-3"><button type="button" onClick={() => setIsSecurityModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700">Confirm</button></div></form></div></div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in"><div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden mx-4 animate-slide-up"><div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700"><h3 className="text-white font-bold text-lg flex items-center gap-2">{editingCategory ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}{editingCategory ? 'Edit Category' : 'New Category'}</h3><button onClick={() => setIsCategoryModalOpen(false)} className="text-white/60 hover:text-white"><X className="w-6 h-6" /></button></div><form onSubmit={handleSaveCategory} className="p-6 space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label><input type="text" required autoFocus className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium" placeholder="Category Name" value={categoryFormData.name} onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label><div className="flex gap-2"><button type="button" onClick={() => setCategoryFormData({...categoryFormData, type: 'income'})} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${categoryFormData.type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Income</button><button type="button" onClick={() => setCategoryFormData({...categoryFormData, type: 'expense'})} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${categoryFormData.type === 'expense' ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Expense</button></div></div><button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-all">{editingCategory ? 'Update' : 'Create'} Category</button></form></div></div>
      )}
    </div>
  );
}