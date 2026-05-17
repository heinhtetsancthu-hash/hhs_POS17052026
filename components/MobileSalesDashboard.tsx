
import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  Save, 
  LogOut, 
  Search, 
  Smartphone, 
  Tag, 
  DollarSign, 
  Calendar as CalendarIcon, 
  Filter,
  Package,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  TrendingUp,
  Download,
  Upload,
  Hash,
  Palette,
  Cpu,
  HardDrive,
  ShoppingBag,
  Eye,
  FileText,
  X,
  Lock,
  AlertCircle,
  Printer
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { BRAND_NAME, BRAND_ADDRESS, BRAND_CONTACT } from '../constants';
import { loadData, saveData, StorageKeys, createFullBackup } from '../services/storage';

interface MobileSalesDashboardProps {
  onLogout: () => void;
}

type View = 'dashboard' | 'stock-list' | 'sold-list' | 'add-entry' | 'backup';

interface MobileStockItem {
  id: string;
  dateAdded: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  imei: string;
  color: string;
  condition: 'New' | 'Second Hand';
  sellingPrice: number;
  status: 'Available' | 'Sold';
  soldDate?: string;
  note?: string;
}

const DEFAULT_STOCK: MobileStockItem[] = [
  {
    id: 'M-1001',
    dateAdded: '2023-10-20',
    brand: 'Apple',
    model: 'iPhone 13',
    ram: '4GB',
    storage: '128GB',
    imei: '356789123456789',
    color: 'Midnight',
    condition: 'Second Hand',
    sellingPrice: 1450000,
    status: 'Available',
    note: 'Minor scratch on bezel'
  },
  {
    id: 'M-1002',
    dateAdded: '2023-10-22',
    brand: 'Samsung',
    model: 'Galaxy A54',
    ram: '8GB',
    storage: '256GB',
    imei: '869504039281745',
    color: 'Lime',
    condition: 'New',
    sellingPrice: 950000,
    status: 'Available',
    note: 'Full set box'
  }
];

export const MobileSalesDashboard: React.FC<MobileSalesDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- State ---
  const [stockItems, setStockItems] = useState<MobileStockItem[]>(() => 
    loadData(StorageKeys.MOBILE_STOCK, DEFAULT_STOCK)
  );

  useEffect(() => {
    saveData(StorageKeys.MOBILE_STOCK, stockItems);
  }, [stockItems]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Filtering State
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  
  // View & Edit States
  const [viewingItem, setViewingItem] = useState<MobileStockItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalItem, setStatusModalItem] = useState<MobileStockItem | null>(null);
  const [statusPassword, setStatusPassword] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState('');

  // Add Entry Form State
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    ram: '',
    storage: '',
    imei: '',
    color: '',
    condition: 'New' as 'New' | 'Second Hand',
    sellingPrice: '',
    status: 'Available' as 'Available' | 'Sold',
    note: ''
  });

  // --- Handlers ---

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing item
      setStockItems(prev => prev.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            brand: formData.brand,
            model: formData.model,
            ram: formData.ram,
            storage: formData.storage,
            imei: formData.imei,
            color: formData.color,
            condition: formData.condition,
            sellingPrice: Number(formData.sellingPrice),
            status: formData.status,
            note: formData.note,
            soldDate: formData.status === 'Sold' && item.status !== 'Sold' ? new Date().toISOString().split('T')[0] : item.soldDate
          };
        }
        return item;
      }));
      alert('Item updated successfully!');
      setEditingId(null);
    } else {
      // Create new item
      const newItem: MobileStockItem = {
        id: `M-${1000 + stockItems.length + 1}`,
        dateAdded: new Date().toISOString().split('T')[0],
        brand: formData.brand,
        model: formData.model,
        ram: formData.ram,
        storage: formData.storage,
        imei: formData.imei,
        color: formData.color,
        condition: formData.condition,
        sellingPrice: Number(formData.sellingPrice),
        status: formData.status,
        note: formData.note,
        soldDate: formData.status === 'Sold' ? new Date().toISOString().split('T')[0] : undefined
      };
      setStockItems(prev => [newItem, ...prev]);
      alert('New stock entry added successfully!');
    }

    // Reset Form
    setFormData({
       brand: '',
       model: '',
       ram: '',
       storage: '',
       imei: '',
       color: '',
       condition: 'New',
       sellingPrice: '',
       status: 'Available',
       note: ''
    });
    
    // Redirect logic
    if (editingId) {
       setCurrentView('stock-list'); // Or back to wherever they came from
    } else {
       setCurrentView('stock-list');
    }
  };

  const handleEditItem = (item: MobileStockItem) => {
    setEditingId(item.id);
    setFormData({
      brand: item.brand,
      model: item.model,
      ram: item.ram,
      storage: item.storage,
      imei: item.imei,
      color: item.color,
      condition: item.condition,
      sellingPrice: String(item.sellingPrice),
      status: item.status,
      note: item.note || ''
    });
    setCurrentView('add-entry');
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setStockItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const initiateStatusToggle = (item: MobileStockItem) => {
    setStatusModalItem(item);
    setStatusPassword('');
    // If currently available, we are making it Sold. Load current note to edit or start empty.
    // If currently Sold, we are making it Available. The note will be cleared.
    setStatusNote(item.status === 'Available' ? (item.note || '') : '');
    setStatusError('');
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!statusModalItem) return;

    // Password Check
    if (statusPassword !== '1471656') {
      setStatusError('Incorrect Password');
      return;
    }

    // Logic for Available -> Sold
    if (statusModalItem.status === 'Available') {
      if (!statusNote.trim()) {
        setStatusError('Note field is required when marking as Sold.');
        return;
      }

      setStockItems(prev => prev.map(item => {
        if (item.id === statusModalItem.id) {
          return {
            ...item,
            status: 'Sold',
            soldDate: new Date().toISOString().split('T')[0],
            note: statusNote
          };
        }
        return item;
      }));
    } 
    // Logic for Sold -> Available
    else {
      setStockItems(prev => prev.map(item => {
        if (item.id === statusModalItem.id) {
          return {
            ...item,
            status: 'Available',
            soldDate: undefined,
            note: '' // Clear note as requested
          };
        }
        return item;
      }));
    }

    setStatusModalOpen(false);
    setStatusModalItem(null);
  };

  const handleAutoBackupAndLogout = () => {
    // Backup with specific filename for Mobile Sales
    createFullBackup('HHS_MOBILE_SALE');
    setTimeout(() => {
      onLogout();
    }, 500);
  };

  const handleBackupNow = () => {
    createFullBackup('HHS_MOBILE_SALE');
  };

  const exportStockListToPDF = () => {
    const element = document.getElementById('stock-list-content');
    if (!element) return;
    
    // Temporarily styles for print to ensure full content is captured
    const originalOverflow = element.style.overflow;
    const originalHeight = element.style.height;
    
    element.classList.add('print-mode');
    element.style.overflow = 'visible';
    element.style.height = 'auto';
    
    const isSoldView = currentView === 'sold-list';
    const filename = isSoldView 
      ? `HHS_Sold_List_${new Date().toISOString().split('T')[0]}.pdf`
      : `HHS_Stock_List_${new Date().toISOString().split('T')[0]}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number], // top, left, bottom, right in mm
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } as const, // Fixed to A4 Portrait
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
         element.classList.remove('print-mode');
         element.style.overflow = originalOverflow;
         element.style.height = originalHeight;
    }).catch((err: any) => {
         console.error('PDF Export Error:', err);
         element.classList.remove('print-mode');
         element.style.overflow = originalOverflow;
         element.style.height = originalHeight;
    });
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.mobileStock && Array.isArray(data.mobileStock)) {
          setStockItems(data.mobileStock);
          alert('Mobile stock data restored successfully!');
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
  const getFilteredItems = (status: 'Available' | 'Sold' | 'All') => {
    return stockItems.filter(item => {
      // 1. Search
      const matchesSearch = item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.imei.includes(searchTerm);
      
      if (!matchesSearch) return false;
      
      // 2. Status
      if (status !== 'All' && item.status !== status) return false;

      // 3. Date Filter (Only apply to Sold items)
      if (status === 'Sold' && item.soldDate) {
          if (dateFilter === 'all') return true;
          
          const [year, month, day] = item.soldDate.split('-').map(Number);
          const itemDate = new Date(year, month - 1, day);
          const now = new Date();
          
          const isSameDate = (d1: Date, d2: Date) => {
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate();
          };

          if (dateFilter === 'today') return isSameDate(itemDate, now);
          if (dateFilter === 'yesterday') {
             const y = new Date(now); y.setDate(y.getDate() - 1);
             return isSameDate(itemDate, y);
          }
          if (dateFilter === 'week') {
             const w = new Date(now); w.setDate(w.getDate() - 7); w.setHours(0,0,0,0);
             return itemDate >= w && itemDate <= now;
          }
          if (dateFilter === 'month') {
             return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
          }
          if (dateFilter === 'custom' && customDateStart && customDateEnd) {
             const start = new Date(customDateStart); start.setHours(0,0,0,0);
             const end = new Date(customDateEnd); end.setHours(23,59,59,999);
             return itemDate >= start && itemDate <= end;
          }
      }
      
      return true;
    });
  };

  // --- Calculations ---
  const totalItems = stockItems.length;
  const availableItems = stockItems.filter(i => i.status === 'Available').length;
  const soldItems = stockItems.filter(i => i.status === 'Sold').length;
  const totalValue = stockItems.filter(i => i.status === 'Available').reduce((acc, curr) => acc + curr.sellingPrice, 0);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock-list', label: 'Stock List', icon: List },
    { id: 'sold-list', label: 'Sold List', icon: ShoppingBag },
    { id: 'add-entry', label: 'Add New Entry', icon: PlusCircle },
    { id: 'backup', label: 'Data Backup & Restore', icon: Save },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Smartphone className="w-24 h-24 text-indigo-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Available Stock</p>
                   <h3 className="text-3xl font-bold text-indigo-600 mt-2">{availableItems} / {totalItems}</h3>
                   <span className="text-indigo-400 text-xs font-medium mt-1 inline-block">Devices ready to sell</span>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <DollarSign className="w-24 h-24 text-emerald-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Total Asset Value</p>
                   <h3 className="text-3xl font-bold text-emerald-600 mt-2">{totalValue.toLocaleString()} MMK</h3>
                   <span className="text-emerald-400 text-xs font-medium mt-1 inline-block">Based on selling price</span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <TrendingUp className="w-24 h-24 text-blue-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Items Sold</p>
                   <h3 className="text-3xl font-bold text-blue-600 mt-2">{soldItems}</h3>
                   <span className="text-blue-400 text-xs font-medium mt-1 inline-block">Lifetime sales count</span>
                </div>
             </div>

             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Recent Additions</h3>
                  <button onClick={() => setCurrentView('stock-list')} className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="p-0">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                         <tr>
                            <th className="p-4">Model</th>
                            <th className="p-4">Specs</th>
                            <th className="p-4">Condition</th>
                            <th className="p-4 text-right">Selling Price</th>
                            <th className="p-4 text-center">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {stockItems.slice(0, 5).map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                               <td className="p-4">
                                  <span className="block font-bold text-slate-800 text-sm">{item.brand} {item.model}</span>
                                  <span className="text-xs text-slate-400">{item.dateAdded}</span>
                               </td>
                               <td className="p-4">
                                  <span className="text-xs text-slate-600 font-medium">{item.ram} / {item.storage}</span>
                               </td>
                               <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${item.condition === 'New' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                     {item.condition}
                                  </span>
                               </td>
                               <td className="p-4 text-right font-bold text-slate-700 text-sm">
                                  {item.sellingPrice.toLocaleString()}
                               </td>
                               <td className="p-4 text-center">
                                  <span className={`inline-block w-2 h-2 rounded-full ${item.status === 'Available' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        );

      case 'add-entry':
        return (
          <div className="h-full flex flex-col animate-fade-in w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      {editingId ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                   </div>
                   <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Inventory Item' : 'Add New Inventory'}</h3>
                </div>
                {editingId && (
                   <button onClick={() => { setEditingId(null); setFormData({brand:'',model:'',ram:'',storage:'',imei:'',color:'',condition:'New',sellingPrice:'',status:'Available',note:''}); }} className="text-sm text-red-500 font-bold hover:underline">
                      Cancel Edit
                   </button>
                )}
              </div>

              <form onSubmit={handleAddEntry} className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Row 1 */}
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Brand</label>
                       <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="text" required 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                            placeholder="e.g. Apple"
                            value={formData.brand}
                            onChange={e => handleInputChange('brand', e.target.value)}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Model</label>
                       <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="text" required 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                            placeholder="e.g. iPhone 14 Pro"
                            value={formData.model}
                            onChange={e => handleInputChange('model', e.target.value)}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color</label>
                       <div className="relative">
                          <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="text" required
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                            placeholder="e.g. Space Black"
                            value={formData.color}
                            onChange={e => handleInputChange('color', e.target.value)}
                          />
                       </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">RAM</label>
                       <div className="relative">
                          <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="text" required 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                            placeholder="e.g. 8GB"
                            value={formData.ram}
                            onChange={e => handleInputChange('ram', e.target.value)}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Storage</label>
                       <div className="relative">
                          <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="text" required 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                            placeholder="e.g. 256GB"
                            value={formData.storage}
                            onChange={e => handleInputChange('storage', e.target.value)}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condition</label>
                       <div className="flex gap-2">
                          <button type="button" onClick={() => setFormData({...formData, condition: 'New'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${formData.condition === 'New' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>New</button>
                          <button type="button" onClick={() => setFormData({...formData, condition: 'Second Hand'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${formData.condition === 'Second Hand' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Second Hand</button>
                       </div>
                    </div>

                    {/* Row 3 */}
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IMEI / Serial</label>
                       <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="text" 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono text-sm"
                            placeholder="Optional"
                            value={formData.imei}
                            onChange={e => handleInputChange('imei', e.target.value)}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Selling Price</label>
                       <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 flex items-center justify-center text-slate-400 font-bold text-xs">K</div>
                          <input 
                            type="number" required 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-bold"
                            placeholder="0"
                            value={formData.sellingPrice}
                            onChange={e => handleInputChange('sellingPrice', e.target.value)}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                       <div className="relative">
                          <select 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 appearance-none text-sm"
                            value={formData.status}
                            onChange={e => handleInputChange('status', e.target.value)}
                          >
                            <option value="Available">Available</option>
                            <option value="Sold">Sold</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* Note */}
                 <div className="flex-1 min-h-0 flex flex-col">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Note</label>
                    <textarea 
                      className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none text-sm"
                      placeholder="Enter additional details..."
                      value={formData.note}
                      onChange={e => handleInputChange('note', e.target.value)}
                    />
                 </div>

                 {/* Button */}
                 <div className="mt-auto">
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                       <Save className="w-5 h-5" /> {editingId ? 'Update Inventory' : 'Save to Inventory'}
                    </button>
                 </div>
              </form>
            </div>
          </div>
        );

      case 'stock-list':
      case 'sold-list':
        const isSoldView = currentView === 'sold-list';
        const filtered = getFilteredItems(isSoldView ? 'Sold' : 'Available');
        
        // Sort items: "New" first, then "Second Hand", then by date added (newest first)
        const displayedItems = filtered.sort((a, b) => {
           if (a.condition === 'New' && b.condition !== 'New') return -1;
           if (a.condition !== 'New' && b.condition === 'New') return 1;
           return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        });
        
        // Calculate Totals for Stock List
        const newItems = displayedItems.filter(i => i.condition === 'New');
        const newTotal = newItems.reduce((sum, item) => sum + item.sellingPrice, 0);
        const newCount = newItems.length;
        
        const secondHandItems = displayedItems.filter(i => i.condition === 'Second Hand');
        const secondHandTotal = secondHandItems.reduce((sum, item) => sum + item.sellingPrice, 0);
        const secondHandCount = secondHandItems.length;
           
        const grandTotal = newTotal + secondHandTotal;
        const grandCount = newCount + secondHandCount;

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in">
             <div className="p-6 border-b border-slate-100">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                     {isSoldView ? <ShoppingBag className="w-5 h-5 text-indigo-600" /> : <Package className="w-5 h-5 text-indigo-600" />} 
                     {isSoldView ? 'Sold History' : 'Inventory List'}
                  </h3>
                  <div className="flex items-center gap-3">
                     {!isSoldView && (
                        <button 
                           onClick={exportStockListToPDF} 
                           className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all text-sm shadow-md"
                        >
                           <Printer className="w-4 h-4" /> View
                        </button>
                     )}
                     {isSoldView && (
                        <button 
                           onClick={exportStockListToPDF} 
                           className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all text-sm shadow-md"
                        >
                           <Printer className="w-4 h-4" /> View
                        </button>
                     )}
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search brand, model, imei..." 
                          className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                     </div>
                  </div>
               </div>

               {/* Date Filter Toolbar (Sold List Only) */}
               {isSoldView && (
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50 p-3 rounded-xl mb-4">
                     <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        <Filter className="w-4 h-4 text-slate-400" />
                        {[
                          { id: 'all', label: 'All Time' },
                          { id: 'today', label: 'Today' },
                          { id: 'yesterday', label: 'Yesterday' },
                          { id: 'week', label: 'Week' },
                          { id: 'month', label: 'Month' },
                          { id: 'custom', label: 'Custom' },
                        ].map(filter => (
                          <button
                            key={filter.id}
                            onClick={() => setDateFilter(filter.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                              dateFilter === filter.id 
                                ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                     </div>

                     {dateFilter === 'custom' && (
                       <div className="flex items-center gap-2 w-full md:w-auto">
                         <CalendarIcon className="w-4 h-4 text-slate-400 hidden md:block" />
                         <input 
                           type="date" 
                           value={customDateStart}
                           onChange={(e) => setCustomDateStart(e.target.value)}
                           className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                           placeholder="Start"
                         />
                         <span className="text-slate-400">-</span>
                         <input 
                           type="date" 
                           value={customDateEnd}
                           onChange={(e) => setCustomDateEnd(e.target.value)}
                           className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                           placeholder="End"
                         />
                       </div>
                     )}
                  </div>
               )}

               {/* Totals Summary (Visible for both Stock & Sold views now) */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                     <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{isSoldView ? 'New Sold' : 'New Total'} ({newCount})</p>
                     <p className="text-lg font-bold text-slate-800">{newTotal.toLocaleString()} <span className="text-xs text-slate-500">MMK</span></p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col items-center text-center">
                     <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{isSoldView ? 'Used Sold' : 'Second Hand Total'} ({secondHandCount})</p>
                     <p className="text-lg font-bold text-slate-800">{secondHandTotal.toLocaleString()} <span className="text-xs text-slate-500">MMK</span></p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                     <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{isSoldView ? 'Total Sales' : 'Grand Total'} ({grandCount})</p>
                     <p className="text-lg font-bold text-slate-800">{grandTotal.toLocaleString()} <span className="text-xs text-slate-500">MMK</span></p>
                  </div>
               </div>
             </div>
             
             <div id="stock-list-content" className="flex-1 overflow-auto bg-white">
                <style>{`
                  @media print {
                     .print-hidden { display: none !important; }
                  }
                  .print-mode .print-hidden { display: none !important; }
                  .print-mode { padding: 20px; }
                `}</style>
                {/* Print Header */}
                <div className="hidden print:block print-mode:block mb-6 text-center border-b pb-4">
                     <h1 className="text-2xl font-bold text-slate-900">{BRAND_NAME}</h1>
                     <p className="text-sm font-bold text-slate-600 mt-1">{BRAND_ADDRESS} | {BRAND_CONTACT}</p>
                     <h2 className="text-lg text-slate-600 mt-2">{isSoldView ? 'Mobile Sales Report' : 'Mobile Stock List'}</h2>
                     <p className="text-sm text-slate-500">Export Date: {new Date().toLocaleDateString()}</p>
                     <div className="mt-4 flex justify-center gap-6 text-sm font-bold">
                        <span>New: {newCount} ({newTotal.toLocaleString()} K)</span>
                        <span>Used: {secondHandCount} ({secondHandTotal.toLocaleString()} K)</span>
                        <span>Total: {grandCount} ({grandTotal.toLocaleString()} K)</span>
                     </div>
                </div>

                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                         <th className="p-4 border-b border-slate-200">Device Info</th>
                         <th className="p-4 border-b border-slate-200">Condition</th>
                         <th className="p-4 border-b border-slate-200 text-right">Selling Price</th>
                         <th className="p-4 border-b border-slate-200 text-center print-hidden">Status</th>
                         <th className="p-4 border-b border-slate-200 text-right print-hidden">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {displayedItems.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                               <div className="font-bold text-slate-800 text-sm">{item.brand} {item.model}</div>
                               <div className="text-xs text-slate-500 flex flex-col gap-0.5 mt-0.5">
                                  <span className="flex items-center gap-1 font-medium text-slate-600">
                                    <Cpu className="w-3 h-3" /> {item.ram} / {item.storage}
                                  </span>
                                  <div className="flex items-center gap-2">
                                     <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> {item.color}</span>
                                     <span className="flex items-center gap-1 font-mono text-[10px]"><Hash className="w-3 h-3" /> {item.imei || 'N/A'}</span>
                                  </div>
                                  {isSoldView && item.soldDate && (
                                     <span className="text-[10px] text-slate-400 mt-1">Sold: {item.soldDate}</span>
                                  )}
                               </div>
                            </td>
                            <td className="p-4">
                               <span className={`px-2 py-1 rounded text-xs font-bold ${item.condition === 'New' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                  {item.condition}
                               </span>
                            </td>
                            <td className="p-4 text-right text-sm font-bold text-slate-800">
                               {item.sellingPrice.toLocaleString()}
                            </td>
                            <td className="p-4 text-center print-hidden">
                               <button 
                                 onClick={() => initiateStatusToggle(item)}
                                 className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 mx-auto w-28 transition-all ${item.status === 'Available' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                               >
                                  {item.status === 'Available' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {item.status}
                               </button>
                            </td>
                            <td className="p-4 text-right print-hidden">
                               <div className="flex justify-end gap-1">
                                  <button onClick={() => setViewingItem(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                                     <Eye className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleEditItem(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                     <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {displayedItems.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No {isSoldView ? 'sold items' : 'inventory'} found.</td></tr>
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
               <Save className="w-5 h-5 text-indigo-600" /> Data Backup & Restore
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-300 transition-colors bg-slate-50/50">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <Download className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Export Mobile Data</h4>
                    <p className="text-slate-500 text-sm mt-1">Download entire database as JSON.</p>
                  </div>
                  <button 
                    onClick={handleBackupNow}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Backup Now
                  </button>
              </div>

              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4 hover:border-emerald-300 transition-colors bg-slate-50/50">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <Upload className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Restore Mobile Data</h4>
                    <p className="text-slate-500 text-sm mt-1">Upload a previously backed up JSON file.</p>
                  </div>
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
                    <Upload className="w-4 h-4" /> Select File
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
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Mobile Sales</p>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
              AD
            </div>
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

      {/* Status Toggle Modal */}
      {statusModalOpen && statusModalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4">
             <div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700">
               <h3 className="text-white font-bold text-lg flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-indigo-400" />
                 Confirm Status Change
               </h3>
               <button onClick={() => setStatusModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <form onSubmit={handleConfirmStatusChange} className="p-6 space-y-4">
               <div className="text-center mb-2">
                  <p className="text-sm text-slate-500">
                     Changing status from <span className="font-bold text-slate-800">{statusModalItem.status}</span> to <span className={`font-bold ${statusModalItem.status === 'Available' ? 'text-red-600' : 'text-emerald-600'}`}>{statusModalItem.status === 'Available' ? 'Sold' : 'Available'}</span>
                  </p>
               </div>
               
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
                     value={statusPassword}
                     onChange={e => setStatusPassword(e.target.value)}
                   />
                 </div>
               </div>

               {statusModalItem.status === 'Available' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note (Required)</label>
                    <textarea 
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm resize-none"
                      placeholder="Enter sales details..."
                      rows={3}
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                    />
                  </div>
               ) : (
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-800">
                     <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Note will be cleared</p>
                     <p className="mt-1">Changing status back to Available will remove the current note.</p>
                  </div>
               )}

               {statusError && (
                 <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-bold text-center animate-fade-in border border-red-100">
                   {statusError}
                 </div>
               )}

               <div className="pt-2 flex gap-3">
                 <button 
                   type="button" 
                   onClick={() => setStatusModalOpen(false)}
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

      {/* View Item Modal */}
      {viewingItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4">
               <div className="p-6 bg-indigo-600 flex justify-between items-center border-b border-indigo-500">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                     <Smartphone className="w-5 h-5" /> Device Details
                  </h3>
                  <button onClick={() => setViewingItem(null)} className="text-white/60 hover:text-white transition-colors">
                     <X className="w-6 h-6" />
                  </button>
               </div>
               <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h2 className="text-2xl font-bold text-slate-900">{viewingItem.brand} {viewingItem.model}</h2>
                        <div className="flex gap-2 mt-2">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${viewingItem.condition === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {viewingItem.condition}
                           </span>
                           <span className={`px-2 py-1 rounded text-xs font-bold ${viewingItem.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {viewingItem.status}
                           </span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-bold text-slate-400 uppercase">Price</p>
                        <p className="text-xl font-bold text-indigo-600">{viewingItem.sellingPrice.toLocaleString()} K</p>
                     </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-6">
                     <div className="grid grid-cols-2 gap-y-4">
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Color</p>
                           <p className="font-bold text-slate-700">{viewingItem.color}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Storage</p>
                           <p className="font-bold text-slate-700">{viewingItem.ram} / {viewingItem.storage}</p>
                        </div>
                        <div className="col-span-2">
                           <p className="text-xs font-bold text-slate-400 uppercase mb-1">IMEI / Serial</p>
                           <p className="font-mono text-slate-600">{viewingItem.imei || 'N/A'}</p>
                        </div>
                        {viewingItem.soldDate && (
                           <div className="col-span-2">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date Sold</p>
                              <p className="font-bold text-slate-700">{viewingItem.soldDate}</p>
                           </div>
                        )}
                        <div className="col-span-2">
                           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Note</p>
                           <p className="text-slate-700 text-sm leading-relaxed">{viewingItem.note || 'No notes added.'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end gap-3">
                     <button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        Close
                     </button>
                     <button 
                        onClick={() => {
                           setViewingItem(null);
                           handleEditItem(viewingItem);
                        }}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                     >
                        <Edit className="w-4 h-4" /> Edit
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
