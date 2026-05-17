
import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  PlusCircle, 
  Save, 
  LogOut, 
  Search, 
  Headphones, 
  DollarSign, 
  TrendingUp, 
  Download, 
  Upload, 
  Filter, 
  Edit, 
  Trash2, 
  Minus, 
  Plus, 
  Calendar as CalendarIcon, 
  ShoppingBag,
  Printer,
  Settings,
  X,
  Check,
  Barcode,
  MapPin,
  Phone,
  FileText,
  User,
  ShieldAlert,
  Lock,
  RotateCcw,
  Database,
  Percent,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
// @ts-ignore
import * as XLSX from 'xlsx';
import { BRAND_NAME, BRAND_ADDRESS, BRAND_CONTACT } from '../constants';
import { loadData, saveData, StorageKeys, createFullBackup, getStorageUsage } from '../services/storage';

interface AccessoriesSalesDashboardProps {
  onLogout: () => void;
}

type View = 'dashboard' | 'inventory' | 'sales-history' | 'backup' | 'settings' | 'database';

interface AccessoryItem {
  id: string;
  name: string;
  category: string;
  price: number; // Selling Price
  buyingPrice: number; // Buying Cost
  quantity: number;
  serialNumber: string; // Unique Identifier
}

interface CartItem extends AccessoryItem {
  sellQuantity: number;
  sellPrice: number;
}

interface SalesRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  date: string;
  voucherId: string;
  status?: 'Sold' | 'Refunded';
}

interface Voucher {
  id: string;
  date: string;
  customerName: string;
  items: SalesRecord[];
  subtotal?: number;
  discountType?: 'amount' | 'percentage';
  discountValue?: number;
  totalAmount: number;
  status?: 'Completed' | 'Refunded';
}

interface AccessoryCategory {
  id: string;
  name: string;
}

const DEFAULT_INVENTORY: AccessoryItem[] = [
  { id: '1', name: 'USB-C Cable', category: 'Cables', price: 5000, buyingPrice: 2000, quantity: 20, serialNumber: 'CBL001' },
  { id: '2', name: 'iPhone 14 Case', category: 'Cases', price: 8000, buyingPrice: 4000, quantity: 15, serialNumber: 'CSE002' },
  { id: '3', name: 'Bluetooth Earbuds', category: 'Audio', price: 25000, buyingPrice: 15000, quantity: 5, serialNumber: 'AUD003' }
];

const DEFAULT_CATEGORIES: AccessoryCategory[] = [
  { id: 'c1', name: 'Cables' },
  { id: 'c2', name: 'Cases' },
  { id: 'c3', name: 'Audio' },
  { id: 'c4', name: 'Chargers' },
  { id: 'c5', name: 'Screen Guards' }
];

export const AccessoriesSalesDashboard: React.FC<AccessoriesSalesDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [inventory, setInventory] = useState<AccessoryItem[]>(() => 
    loadData(StorageKeys.ACCESSORIES_INVENTORY, DEFAULT_INVENTORY)
  );
  
  const [sales, setSales] = useState<SalesRecord[]>(() => 
    loadData(StorageKeys.ACCESSORIES_SALES, [])
  );

  const [vouchers, setVouchers] = useState<Voucher[]>(() => 
    loadData(StorageKeys.ACCESSORIES_VOUCHERS, [])
  );

  const [categories, setCategories] = useState<AccessoryCategory[]>(() => 
    loadData(StorageKeys.ACCESSORIES_CATEGORIES, DEFAULT_CATEGORIES)
  );

  const [settings, setSettings] = useState(() => 
    loadData(StorageKeys.ACCESSORIES_SETTINGS, { 
      footerText: "Thank you for shopping with us!" 
    })
  );

  // Scanner State
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    saveData(StorageKeys.ACCESSORIES_INVENTORY, inventory);
  }, [inventory]);

  useEffect(() => {
    saveData(StorageKeys.ACCESSORIES_SALES, sales);
  }, [sales]);

  useEffect(() => {
    saveData(StorageKeys.ACCESSORIES_VOUCHERS, vouchers);
  }, [vouchers]);

  useEffect(() => {
    saveData(StorageKeys.ACCESSORIES_CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    saveData(StorageKeys.ACCESSORIES_SETTINGS, settings);
  }, [settings]);

  // Auto-focus scanner on Inventory View
  useEffect(() => {
    if (currentView === 'inventory' && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
    }
  }, [currentView]);

  // Form State for Adding/Editing Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessoryItem | null>(null);
  const [isAddStockMode, setIsAddStockMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    buyingPrice: '0',
    quantity: '',
    serialNumber: ''
  });

  // Cart & Voucher State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [voucherCustomerName, setVoucherCustomerName] = useState('');
  
  // Discount State
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState('');
  
  // Viewing History Voucher
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AccessoryCategory | null>(null);
  const [categoryFormName, setCategoryFormName] = useState('');

  // Security & Refund State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [voucherToRefund, setVoucherToRefund] = useState<Voucher | null>(null);

  // Inventory Security State
  const [isInventorySecurityOpen, setIsInventorySecurityOpen] = useState(false);
  const [inventorySecurityKey, setInventorySecurityKey] = useState('');
  const [inventorySecurityError, setInventorySecurityError] = useState('');
  const [inventoryAction, setInventoryAction] = useState<'edit' | 'delete' | null>(null);
  const [inventoryActionItem, setInventoryActionItem] = useState<AccessoryItem | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Sales History Filters
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesDateFilter, setSalesDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [salesCustomStart, setSalesCustomStart] = useState('');
  const [salesCustomEnd, setSalesCustomEnd] = useState('');

  // --- Handlers ---
  
  const handleOpenModal = (item?: AccessoryItem) => {
    setIsAddStockMode(false);
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        buyingPrice: item.buyingPrice.toString(),
        quantity: item.quantity.toString(),
        serialNumber: item.serialNumber || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ 
        name: '', 
        category: categories.length > 0 ? categories[0].name : '', 
        price: '', 
        buyingPrice: '0', 
        quantity: '',
        serialNumber: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (isAddStockMode) {
       // Add Stock Logic
       const searchSN = formData.serialNumber.trim().toLowerCase();
       const existingItem = inventory.find(i => i.serialNumber.trim().toLowerCase() === searchSN);
       
       if (existingItem) {
          const qtyToAdd = Number(formData.quantity);
          
          if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
             alert('Please enter a valid quantity greater than 0.');
             return;
          }

          setInventory(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: i.quantity + qtyToAdd } : i));
          alert(`Added ${qtyToAdd} to ${existingItem.name}. New total: ${existingItem.quantity + qtyToAdd}`);
       } else {
          alert('Item with this Serial Number not found.');
          return;
       }
    } else {
       // Create/Update Logic
        // Check Serial Number Uniqueness
        if (formData.serialNumber.trim()) {
            const isDuplicate = inventory.some(i => 
                i.serialNumber.toLowerCase() === formData.serialNumber.trim().toLowerCase() && 
                i.id !== editingItem?.id
            );
            if (isDuplicate) {
                alert('Serial Number must be unique. This Serial Number already exists in the inventory.');
                return;
            }
        }

        if (editingItem) {
          setInventory(prev => prev.map(i => i.id === editingItem.id ? {
            ...i,
            name: formData.name,
            category: formData.category,
            price: Number(formData.price),
            buyingPrice: Number(formData.buyingPrice),
            quantity: Number(formData.quantity),
            serialNumber: formData.serialNumber
          } : i));
        } else {
          const newItem: AccessoryItem = {
            id: Date.now().toString(),
            name: formData.name,
            category: formData.category,
            price: Number(formData.price),
            buyingPrice: Number(formData.buyingPrice),
            quantity: Number(formData.quantity),
            serialNumber: formData.serialNumber
          };
          setInventory(prev => [...prev, newItem]);
        }
    }
    setIsModalOpen(false);
  };

  // Effect to lookup item by serial in Add Stock Mode
  useEffect(() => {
     if (isAddStockMode && formData.serialNumber) {
        const found = inventory.find(i => i.serialNumber.trim().toLowerCase() === formData.serialNumber.trim().toLowerCase());
        if (found) {
           setFormData(prev => ({
              ...prev,
              name: found.name,
              category: found.category,
              price: found.price.toString(),
              buyingPrice: found.buyingPrice.toString(),
              // Do not set quantity here, let user type amount to add
           }));
        } else {
           // Reset fields if not found (optional, or keep typing)
           setFormData(prev => ({
              ...prev,
              name: '',
              category: categories.length > 0 ? categories[0].name : '',
              price: '',
              buyingPrice: '0'
           }));
        }
     }
  }, [formData.serialNumber, isAddStockMode, inventory, categories]);

  const handleInventoryAction = (action: 'edit' | 'delete', item: AccessoryItem) => {
     setInventoryAction(action);
     setInventoryActionItem(item);
     setInventorySecurityKey('');
     setInventorySecurityError('');
     setIsInventorySecurityOpen(true);
  };

  const handleInventorySecuritySubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (inventorySecurityKey === '09428121908') {
        if (inventoryAction === 'delete' && inventoryActionItem) {
           const idToDelete = inventoryActionItem.id;
           setInventory(prev => prev.filter(i => i.id !== idToDelete));
        } else if (inventoryAction === 'edit' && inventoryActionItem) {
           handleOpenModal(inventoryActionItem);
        }
        setIsInventorySecurityOpen(false);
        setInventoryAction(null);
        setInventoryActionItem(null);
        setInventorySecurityKey('');
     } else {
        setInventorySecurityError('Incorrect Key');
     }
  };

  // --- Cart Handlers ---

  const handleAddToCart = (item: AccessoryItem) => {
    // Note: We check current 'cart' state. For rapid scanning, strict state updates 
    // are handled by React's queue, but we assume stock check passes on current render state.
    const existingInCart = cart.find(c => c.id === item.id);
    const currentCartQty = existingInCart ? existingInCart.sellQuantity : 0;

    if (currentCartQty + 1 > item.quantity) {
      alert(`Cannot add ${item.name}. Out of stock!`);
      return;
    }

    if (existingInCart) {
      setCart(prev => prev.map(c => c.id === item.id ? { ...c, sellQuantity: c.sellQuantity + 1 } : c));
    } else {
      setCart(prev => [...prev, { ...item, sellQuantity: 1, sellPrice: item.price }]);
    }
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scanInput.trim();
      if (!code) return;

      // Find item by serial number
      const item = inventory.find(i => i.serialNumber && i.serialNumber.toLowerCase() === code.toLowerCase());
      
      if (item) {
        handleAddToCart(item);
        setScanInput(''); // Clear input for next scan
      } else {
        alert('Item not found with this Serial Number!');
        e.currentTarget.select(); // Select text to allow easy retry
      }
    }
  };

  const handleUpdateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        // Validate Quantity against Stock
        const originalItem = inventory.find(i => i.id === id);
        if (originalItem && updated.sellQuantity > originalItem.quantity) {
           alert('Quantity exceeds available stock.');
           return c;
        }
        return updated;
      }
      return c;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const voucherId = `V-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const newSalesRecords: SalesRecord[] = [];
    
    // Calculate Totals
    const subTotal = cart.reduce((acc, curr) => acc + (curr.sellPrice * curr.sellQuantity), 0);
    
    let discountAmount = 0;
    const numDiscount = Number(discountValue);
    if (numDiscount > 0) {
        if (discountType === 'amount') {
            discountAmount = numDiscount;
        } else {
            discountAmount = (subTotal * numDiscount) / 100;
        }
    }
    const finalTotal = Math.max(0, subTotal - discountAmount);

    // 1. Update Inventory & Create Sales Records
    const updatedInventory = [...inventory];
    
    cart.forEach(cartItem => {
       const inventoryIndex = updatedInventory.findIndex(i => i.id === cartItem.id);
       if (inventoryIndex > -1) {
          updatedInventory[inventoryIndex].quantity -= cartItem.sellQuantity;
       }

       const saleTotal = cartItem.sellPrice * cartItem.sellQuantity;

       newSalesRecords.push({
          id: `${voucherId}-${cartItem.id}`,
          voucherId: voucherId,
          itemId: cartItem.id,
          itemName: cartItem.name,
          quantity: cartItem.sellQuantity,
          unitPrice: cartItem.sellPrice,
          totalPrice: saleTotal,
          date: date,
          status: 'Sold'
       });
    });

    setInventory(updatedInventory);
    setSales(prev => [...newSalesRecords, ...prev]);

    // 2. Create Voucher
    const newVoucher: Voucher = {
       id: voucherId,
       date: date,
       customerName: voucherCustomerName || 'Walk-in Customer',
       items: newSalesRecords,
       subtotal: subTotal,
       discountType: numDiscount > 0 ? discountType : undefined,
       discountValue: numDiscount > 0 ? numDiscount : undefined,
       totalAmount: finalTotal,
       status: 'Completed'
    };

    setVouchers(prev => [newVoucher, ...prev]);

    // 3. Reset
    setCart([]);
    setVoucherCustomerName('');
    setDiscountValue('');
    setDiscountType('amount');
    setIsCartOpen(false);
    
    // 4. Show Voucher Preview
    setSelectedVoucher(newVoucher);
  };

  const handlePrintVoucher = () => {
    const element = document.getElementById('voucher-content');
    if (element) {
        const opt = {
            margin: 0,
            filename: `Voucher_${selectedVoucher?.id || 'New'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    }
  };

  // --- Refund Handlers ---
  const handleInitiateRefund = (voucher: Voucher) => {
    setVoucherToRefund(voucher);
    setSecurityPassword('');
    setSecurityError('');
    setIsSecurityModalOpen(true);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityPassword === '1471656') { // Matching the admin password from other components
        if (voucherToRefund) {
            processRefund(voucherToRefund);
        }
        setIsSecurityModalOpen(false);
        setSecurityPassword('');
        setVoucherToRefund(null);
    } else {
        setSecurityError('Incorrect Password');
    }
  };

  const processRefund = (voucher: Voucher) => {
    // 1. Restore Inventory
    const updatedInventory = [...inventory];
    voucher.items.forEach(saleItem => {
        const itemIndex = updatedInventory.findIndex(i => i.id === saleItem.itemId);
        if (itemIndex > -1) {
            updatedInventory[itemIndex].quantity += saleItem.quantity;
        }
        // If item doesn't exist (deleted), we skip restoring stock but still mark as refunded
    });
    setInventory(updatedInventory);

    // 2. Update Voucher Status
    const updatedVoucher = { ...voucher, status: 'Refunded' as const };
    setVouchers(prev => prev.map(v => v.id === voucher.id ? updatedVoucher : v));

    // 3. Update Sales Records Status
    setSales(prev => prev.map(s => s.voucherId === voucher.id ? { ...s, status: 'Refunded' } : s));
    
    // 4. Update Selected Voucher View
    if (selectedVoucher && selectedVoucher.id === voucher.id) {
        setSelectedVoucher(updatedVoucher);
    }
    
    alert('Voucher refunded and stock restored successfully.');
  };

  // --- Category Handlers ---

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setCategoryFormName('');
    setIsCategoryModalOpen(true);
  };

  const handleEditCategoryClick = (cat: AccessoryCategory) => {
    setEditingCategory(cat);
    setCategoryFormName(cat.name);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName.trim()) return;

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: categoryFormName } : c));
      setInventory(prev => prev.map(item => item.category === editingCategory.name ? { ...item, category: categoryFormName } : item));
    } else {
      const newCat: AccessoryCategory = {
        id: Date.now().toString(),
        name: categoryFormName
      };
      setCategories(prev => [...prev, newCat]);
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (cat: AccessoryCategory) => {
    if (confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
      setCategories(prev => prev.filter(c => c.id !== cat.id));
    }
  };

  const handleBackupNow = () => {
    createFullBackup('HHS_ACCESSORIES');
  };

  const handleAutoBackupAndLogout = () => {
    createFullBackup('HHS_ACCESSORIES');
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
          if (data.accessoriesInventory && Array.isArray(data.accessoriesInventory)) {
            setInventory(data.accessoriesInventory);
            if (data.accessoriesSales && Array.isArray(data.accessoriesSales)) {
                setSales(data.accessoriesSales);
            }
            if (data.accessoriesCategories && Array.isArray(data.accessoriesCategories)) {
                setCategories(data.accessoriesCategories);
            }
            if (data.accessoriesVouchers && Array.isArray(data.accessoriesVouchers)) {
                setVouchers(data.accessoriesVouchers);
            }
            if (data.accessoriesSettings) {
                setSettings(data.accessoriesSettings);
            }
            alert('Accessories data restored successfully!');
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

  // --- Excel Handlers ---
  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    
    // Inventory
    const wsInv = XLSX.utils.json_to_sheet(inventory);
    XLSX.utils.book_append_sheet(wb, wsInv, "Inventory");
    
    // Sales
    const wsSales = XLSX.utils.json_to_sheet(sales);
    XLSX.utils.book_append_sheet(wb, wsSales, "Sales");
    
    // Categories
    const wsCat = XLSX.utils.json_to_sheet(categories);
    XLSX.utils.book_append_sheet(wb, wsCat, "Categories");
    
    // Vouchers (Flatten nested 'items' to string for preservation)
    const vouchersForExcel = vouchers.map(v => ({
      ...v,
      items: JSON.stringify(v.items)
    }));
    const wsVouch = XLSX.utils.json_to_sheet(vouchersForExcel);
    XLSX.utils.book_append_sheet(wb, wsVouch, "Vouchers");

    XLSX.writeFile(wb, `HHS_Accessories_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Filtering ---
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  const filteredInventory = inventory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchLower) || 
                          item.category.toLowerCase().includes(searchLower) ||
                          (item.serialNumber && item.serialNumber.toLowerCase().includes(searchLower));
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // --- Dashboard Stats ---
  const totalStockValue = inventory.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const totalItems = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
  const lowStockItems = inventory.filter(i => i.quantity < 5).length;
  // Calculate Today's Sales (excluding refunded)
  const todaySales = sales
    .filter(s => s.date === new Date().toISOString().split('T')[0] && s.status !== 'Refunded')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Cart Calculations
  const cartSubTotal = cart.reduce((acc, curr) => acc + (curr.sellPrice * curr.sellQuantity), 0);
  const numDiscount = Number(discountValue) || 0;
  let cartDiscountAmount = 0;
  if (numDiscount > 0) {
      if (discountType === 'amount') {
          cartDiscountAmount = numDiscount;
      } else {
          cartDiscountAmount = (cartSubTotal * numDiscount) / 100;
      }
  }
  const cartFinalTotal = Math.max(0, cartSubTotal - cartDiscountAmount);

  // --- Sales History Filtering Logic ---
  const getFilteredVouchers = () => {
    return vouchers.filter(v => {
      // 1. Text Search (ID, Customer, Item Name)
      const term = salesSearchTerm.toLowerCase();
      const matchesText = 
        v.id.toLowerCase().includes(term) ||
        v.customerName.toLowerCase().includes(term) ||
        v.items.some(item => item.itemName.toLowerCase().includes(term));

      if (!matchesText) return false;

      // 2. Date Filtering
      if (salesDateFilter === 'all') return true;

      const vDate = new Date(v.date);
      const now = new Date();
      now.setHours(0,0,0,0);
      const targetDate = new Date(vDate.getFullYear(), vDate.getMonth(), vDate.getDate());

      if (salesDateFilter === 'today') {
        return targetDate.getTime() === now.getTime();
      }
      
      if (salesDateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return targetDate >= weekAgo && targetDate <= now;
      }

      if (salesDateFilter === 'month') {
        return targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear();
      }

      if (salesDateFilter === 'custom' && salesCustomStart && salesCustomEnd) {
        const start = new Date(salesCustomStart);
        start.setHours(0,0,0,0);
        const end = new Date(salesCustomEnd);
        end.setHours(23,59,59,999);
        return targetDate >= start && targetDate <= end;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };


  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory (POS)', icon: Package },
    { id: 'sales-history', label: 'Sales History', icon: ShoppingBag },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'backup', label: 'Data Backup', icon: Save },
    { id: 'database', label: 'Local Database', icon: Database },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <DollarSign className="w-24 h-24 text-emerald-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Today's Sales</p>
                   <h3 className="text-2xl font-bold text-emerald-600 mt-2">{todaySales.toLocaleString()} MMK</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Package className="w-24 h-24 text-indigo-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Total Stock Value</p>
                   <h3 className="text-2xl font-bold text-indigo-600 mt-2">{totalStockValue.toLocaleString()} MMK</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Headphones className="w-24 h-24 text-cyan-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Total Items</p>
                   <h3 className="text-2xl font-bold text-cyan-600 mt-2">{totalItems}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <TrendingUp className="w-24 h-24 text-orange-600" />
                   </div>
                   <p className="text-slate-500 text-sm font-medium">Low Stock Alerts</p>
                   <h3 className="text-2xl font-bold text-orange-600 mt-2">{lowStockItems}</h3>
                </div>
             </div>

             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Low Stock Items</h3>
                  <button onClick={() => setCurrentView('inventory')} className="text-indigo-600 text-sm font-medium hover:underline">View All Inventory</button>
                </div>
                <div className="p-0">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                         <tr>
                            <th className="p-4">Item Name</th>
                            <th className="p-4">Category</th>
                            <th className="p-4 text-right">Price</th>
                            <th className="p-4 text-center">Quantity</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {inventory.filter(i => i.quantity < 5).map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                               <td className="p-4 font-bold text-slate-800 text-sm">{item.name}</td>
                               <td className="p-4 text-xs text-slate-500">{item.category}</td>
                               <td className="p-4 text-right font-bold text-slate-700 text-sm">{item.price.toLocaleString()}</td>
                               <td className="p-4 text-center">
                                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">{item.quantity}</span>
                               </td>
                            </tr>
                         ))}
                         {lowStockItems === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No low stock items.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in relative">
             <div className="p-6 border-b border-slate-100">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                     <Headphones className="w-5 h-5 text-indigo-600" /> Inventory & POS
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700">
                        <PlusCircle className="w-4 h-4" /> Add Item
                    </button>
                  </div>
               </div>
               
               <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search items by name..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                     className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                     value={categoryFilter}
                     onChange={e => setCategoryFilter(e.target.value)}
                  >
                     <option value="All">All Categories</option>
                     {sortedCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
               </div>

               {/* Barcode Scanner Input */}
               <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-sm relative">
                  <Barcode className="w-5 h-5 text-indigo-600 absolute left-3" />
                  <input 
                    ref={barcodeInputRef}
                    type="text" 
                    placeholder="Scan Barcode / Serial Number to Quick Add to Cart..." 
                    className="w-full bg-transparent border-none outline-none text-indigo-900 placeholder-indigo-400 font-bold font-mono text-sm pl-8"
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                  />
                  <div className="hidden md:block text-[10px] font-bold text-indigo-400 bg-white/50 px-2 py-1 rounded border border-indigo-100">
                    PRESS ENTER
                  </div>
               </div>
             </div>

             <div className="flex-1 overflow-auto pb-20">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                         <th className="p-4">Item Name</th>
                         <th className="p-4">Category</th>
                         <th className="p-4 text-right">Selling Price</th>
                         <th className="p-4 text-center">Stock</th>
                         <th className="p-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredInventory.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-4">
                               <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                               {item.serialNumber && <div className="text-[10px] text-slate-400 font-mono mt-0.5">SN: {item.serialNumber}</div>}
                            </td>
                            <td className="p-4 text-xs text-slate-500 font-bold px-2 py-1 rounded bg-slate-100 inline-block mt-2 ml-4 md:ml-0 md:mt-0 md:inline">{item.category}</td>
                            <td className="p-4 text-right font-bold text-slate-700">{item.price.toLocaleString()}</td>
                            <td className="p-4 text-center">
                               <span className={`px-2 py-1 rounded text-xs font-bold ${item.quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {item.quantity}
                               </span>
                            </td>
                            <td className="p-4 text-right">
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => handleAddToCart(item)} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1">
                                     <Plus className="w-3 h-3" /> Cart
                                  </button>
                                  <button onClick={() => handleInventoryAction('edit', item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                     <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleInventoryAction('delete', item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {filteredInventory.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No items found.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>

             {/* Floating Cart Button */}
             <button 
                onClick={() => setIsCartOpen(true)}
                className="absolute bottom-6 right-6 px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all z-20 group"
             >
                <div className="relative">
                   <ShoppingCart className="w-5 h-5" />
                   {cart.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">{cart.length}</span>}
                </div>
                <span className="font-bold">View Cart</span>
                <span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs font-mono">{cartFinalTotal.toLocaleString()} K</span>
             </button>
          </div>
        );

      case 'sales-history':
        const filteredVouchers = getFilteredVouchers();
        const filteredSalesTotal = filteredVouchers.reduce((acc, v) => v.status !== 'Refunded' ? acc + v.totalAmount : acc, 0);

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in">
             <div className="p-6 border-b border-slate-100 space-y-4">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-indigo-600" /> Sales Transactions
                  </h3>
                  
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search ID, Customer, Item..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                      value={salesSearchTerm}
                      onChange={e => setSalesSearchTerm(e.target.value)}
                    />
                  </div>
               </div>

               {/* Filters */}
               <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl">
                  <Filter className="w-4 h-4 text-slate-400" />
                  {['all', 'today', 'week', 'month', 'custom'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setSalesDateFilter(f as any)} 
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        salesDateFilter === f 
                          ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' 
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-white/50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  
                  {salesDateFilter === 'custom' && (
                    <div className="flex items-center gap-2 animate-fade-in ml-auto md:ml-0">
                      <input 
                        type="date" 
                        value={salesCustomStart} 
                        onChange={e => setSalesCustomStart(e.target.value)} 
                        className="px-2 py-1 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-indigo-400" 
                      />
                      <span className="text-slate-400">-</span>
                      <input 
                        type="date" 
                        value={salesCustomEnd} 
                        onChange={e => setSalesCustomEnd(e.target.value)} 
                        className="px-2 py-1 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-indigo-400" 
                      />
                    </div>
                  )}
               </div>

               {/* Summary Card */}
               <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between animate-fade-in">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Sales ({filteredVouchers.length} Vouchers)</p>
                    <p className="text-2xl font-bold text-slate-800">{filteredSalesTotal.toLocaleString()} <span className="text-xs font-medium text-slate-500">MMK</span></p>
                  </div>
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
               </div>
             </div>

             <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                         <th className="p-4">Date</th>
                         <th className="p-4">Voucher ID</th>
                         <th className="p-4">Customer</th>
                         <th className="p-4 text-center">Items</th>
                         <th className="p-4 text-right">Total Amount</th>
                         <th className="p-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredVouchers.map(v => (
                         <tr key={v.id} className={`hover:bg-slate-50 cursor-pointer ${v.status === 'Refunded' ? 'bg-red-50/50 hover:bg-red-50' : ''}`} onClick={() => setSelectedVoucher(v)}>
                            <td className="p-4 text-slate-500 text-sm">{v.date}</td>
                            <td className="p-4 font-mono text-xs text-indigo-600 font-bold">
                                {v.id}
                                {v.status === 'Refunded' && <span className="ml-2 text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">REFUNDED</span>}
                            </td>
                            <td className="p-4 font-bold text-slate-800 text-sm">{v.customerName}</td>
                            <td className="p-4 text-center font-medium text-slate-700">{v.items.length}</td>
                            <td className={`p-4 text-right font-bold ${v.status === 'Refunded' ? 'text-red-400 line-through' : 'text-emerald-600'}`}>{v.totalAmount.toLocaleString()}</td>
                            <td className="p-4 text-right">
                               <button onClick={(e) => { e.stopPropagation(); setSelectedVoucher(v); }} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">
                                  View / Print
                               </button>
                            </td>
                         </tr>
                      ))}
                      {filteredVouchers.length === 0 && (
                         <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No sales history found matching your filters.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        );

      case 'settings':
         return (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-600" /> Settings
                   </h3>
                   <button onClick={handleAddCategoryClick} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700">
                      <PlusCircle className="w-4 h-4" /> Add Category
                   </button>
                </div>
                <div className="p-6 flex-1 overflow-auto">
                   <div className="max-w-2xl mx-auto space-y-8">
                      {/* Voucher Settings */}
                      <div>
                          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Voucher Settings</h4>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Footer Message</label>
                              <textarea 
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
                                  rows={3}
                                  value={settings.footerText}
                                  onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                                  placeholder="Enter text to appear at the bottom of the voucher..."
                              />
                              <p className="text-xs text-slate-400 mt-2">This text will appear approximately 0.5 inches from the bottom of the printed A5 voucher.</p>
                          </div>
                      </div>

                      {/* Category Settings */}
                      <div>
                          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Category Management</h4>
                          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                             {sortedCategories.length > 0 ? (
                               <div className="divide-y divide-slate-200">
                                  {sortedCategories.map(cat => (
                                     <div key={cat.id} className="p-4 flex justify-between items-center hover:bg-white transition-colors">
                                        <span className="font-bold text-slate-700">{cat.name}</span>
                                        <div className="flex gap-2">
                                           <button onClick={() => handleEditCategoryClick(cat)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                              <Edit className="w-4 h-4" />
                                           </button>
                                           <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                             ) : (
                               <div className="p-8 text-center text-slate-400 italic">No categories defined. Add one to get started.</div>
                             )}
                          </div>
                      </div>
                   </div>
                </div>
             </div>
         );

      case 'backup':
         return (
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fade-in max-w-4xl mx-auto">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Save className="w-5 h-5 text-indigo-600" /> Data Backup & Restore
               </h3>
               
               {/* JSON Backup */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-300 transition-colors bg-slate-50/50">
                     <div className="p-3 bg-white rounded-full shadow-sm"><Download className="w-6 h-6 text-indigo-500"/></div>
                     <h4 className="font-bold text-slate-700">Full System Backup (JSON)</h4>
                     <p className="text-xs text-slate-500">Save all data including hidden settings.</p>
                     <button onClick={handleBackupNow} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2">
                       <Save className="w-4 h-4" /> Backup JSON
                     </button>
                 </div>
   
                 <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4 hover:border-emerald-300 transition-colors bg-slate-50/50">
                     <div className="p-3 bg-white rounded-full shadow-sm"><Upload className="w-6 h-6 text-emerald-500"/></div>
                     <h4 className="font-bold text-slate-700">Restore System (JSON)</h4>
                     <p className="text-xs text-slate-500">Restore full system from JSON file.</p>
                     <input type="file" ref={fileInputRef} onChange={handleImportData} accept="application/json" className="hidden" />
                     <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2">
                       <Upload className="w-4 h-4" /> Restore JSON
                     </button>
                 </div>
               </div>

               {/* Excel Backup */}
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 pt-6 border-t border-slate-100">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Excel Export
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4 hover:border-emerald-300 transition-colors bg-emerald-50/30">
                     <div className="p-3 bg-white rounded-full shadow-sm"><FileSpreadsheet className="w-6 h-6 text-emerald-600"/></div>
                     <h4 className="font-bold text-slate-700">Export to Excel</h4>
                     <p className="text-xs text-slate-500">Editable format for Inventory & Sales.</p>
                     <button onClick={handleExcelExport} className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-medium flex items-center gap-2">
                       <Download className="w-4 h-4" /> Export XLSX
                     </button>
                 </div>
               </div>
             </div>
         );

      case 'database':
         return (
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" /> Local Database Status
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Inventory Items</p>
                    <p className="text-2xl font-bold text-slate-800">{inventory.length}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total Vouchers</p>
                    <p className="text-2xl font-bold text-slate-800">{vouchers.length}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Sales Records</p>
                    <p className="text-2xl font-bold text-slate-800">{sales.length}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Categories</p>
                    <p className="text-2xl font-bold text-slate-800">{categories.length}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Storage Usage</p>
                    <p className="text-2xl font-bold text-slate-800">{getStorageUsage()}</p>
                 </div>
               </div>
             </div>
         );
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl shadow-slate-200/50">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-display font-bold text-xl text-slate-900">{BRAND_NAME}</h2>
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mt-1">Accessories</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto pt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id
                  ? 'bg-cyan-50 text-cyan-600 font-bold shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-cyan-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleAutoBackupAndLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-xs">AD</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 relative">
           <div className="fixed top-0 right-0 -z-10 opacity-30 pointer-events-none">
             <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
             <div className="absolute top-40 right-60 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
           </div>
           {renderContent()}
        </div>
      </main>

      {/* Cart Drawer/Modal */}
      {isCartOpen && (
         <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-up">
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-indigo-600" /> Current Cart</h3>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.map(item => (
                     <div key={item.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className="font-bold text-slate-800">{item.name}</h4>
                              <p className="text-xs text-slate-500">{item.category}</p>
                           </div>
                           <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price</label>
                              <input 
                                 type="number" 
                                 className="w-full px-2 py-1 border border-slate-200 rounded text-sm font-bold text-slate-700" 
                                 value={item.sellPrice}
                                 onChange={e => handleUpdateCartItem(item.id, { sellPrice: Number(e.target.value) })}
                              />
                           </div>
                           <div className="w-24">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                              <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                                 <button onClick={() => handleUpdateCartItem(item.id, { sellQuantity: Math.max(1, item.sellQuantity - 1) })} className="px-2 py-1 bg-slate-50 hover:bg-slate-100"><Minus className="w-3 h-3" /></button>
                                 <input 
                                    type="text" 
                                    readOnly 
                                    className="w-full text-center text-sm font-bold bg-white" 
                                    value={item.sellQuantity}
                                 />
                                 <button onClick={() => handleUpdateCartItem(item.id, { sellQuantity: item.sellQuantity + 1 })} className="px-2 py-1 bg-slate-50 hover:bg-slate-100"><Plus className="w-3 h-3" /></button>
                              </div>
                           </div>
                        </div>
                        <div className="text-right font-bold text-emerald-600 text-sm">
                           {(item.sellPrice * item.sellQuantity).toLocaleString()} K
                        </div>
                     </div>
                  ))}
                  {cart.length === 0 && <div className="text-center text-slate-400 py-10 italic">Cart is empty</div>}
               </div>

               <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name (Optional)</label>
                     <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           type="text" 
                           className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" 
                           placeholder="Enter customer name"
                           value={voucherCustomerName}
                           onChange={e => setVoucherCustomerName(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="mb-4">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Add Discount</label>
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                           {discountType === 'percentage' && <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                           {discountType === 'amount' && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">K</div>}
                           <input 
                              type="number"
                              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-red-600"
                              placeholder="0"
                              value={discountValue}
                              onChange={e => setDiscountValue(e.target.value)}
                           />
                        </div>
                        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                           <button 
                              onClick={() => setDiscountType('amount')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${discountType === 'amount' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                           >
                              Amount
                           </button>
                           <button 
                              onClick={() => setDiscountType('percentage')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${discountType === 'percentage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                           >
                              %
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-1 mb-4 pt-2 border-t border-slate-200 border-dashed">
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Subtotal</span>
                        <span className="font-bold text-slate-700">{cartSubTotal.toLocaleString()} K</span>
                     </div>
                     {cartDiscountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm text-red-500">
                           <span className="font-bold">Discount {discountType === 'percentage' ? `(${numDiscount}%)` : ''}</span>
                           <span className="font-bold">-{cartDiscountAmount.toLocaleString()} K</span>
                        </div>
                     )}
                     <div className="flex justify-between items-center text-lg pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-800">Total Amount</span>
                        <span className="font-bold text-emerald-600">{cartFinalTotal.toLocaleString()} K</span>
                     </div>
                  </div>

                  <button 
                     onClick={handleCheckout} 
                     disabled={cart.length === 0}
                     className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                     Confirm Sale & Print
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Add/Edit Item Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-slide-up">
               <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit Item' : isAddStockMode ? 'Add Stock' : 'Add New Item'}</h3>
               
               {!editingItem && (
                  <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
                     <input 
                        type="checkbox" 
                        id="addStockMode"
                        checked={isAddStockMode}
                        onChange={(e) => {
                           setIsAddStockMode(e.target.checked);
                           if (!e.target.checked) {
                              setFormData({
                                 name: '',
                                 category: categories.length > 0 ? categories[0].name : '',
                                 price: '',
                                 buyingPrice: '0',
                                 quantity: '',
                                 serialNumber: ''
                              });
                           }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded"
                     />
                     <label htmlFor="addStockMode" className="text-sm font-bold text-indigo-700 cursor-pointer select-none">
                        Add Stock to Existing Item
                     </label>
                  </div>
               )}

               <form onSubmit={handleSaveItem} className="space-y-4">
                  {isAddStockMode && (
                     <div className="mb-4 text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                        Enter a Serial Number to auto-fill details and add stock.
                     </div>
                  )}
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serial No {isAddStockMode && '(Required)'}</label>
                     <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           type="text" 
                           required={isAddStockMode}
                           className="w-full pl-9 pr-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                           value={formData.serialNumber} 
                           onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                           placeholder="Scan or Type Serial Number"
                           autoFocus={isAddStockMode}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                     <input 
                        type="text" 
                        required 
                        className={`w-full px-3 py-2 border rounded-lg ${isAddStockMode ? 'bg-slate-100 text-slate-500' : ''}`}
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        readOnly={isAddStockMode}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                     <select 
                        required 
                        className={`w-full px-3 py-2 border rounded-lg bg-white ${isAddStockMode ? 'bg-slate-100 text-slate-500 pointer-events-none' : ''}`}
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        disabled={isAddStockMode}
                     >
                        <option value="">Select Category</option>
                        {sortedCategories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buying Price</label>
                        <input 
                           type="number" 
                           required 
                           className={`w-full px-3 py-2 border rounded-lg ${isAddStockMode ? 'bg-slate-100 text-slate-500' : ''}`}
                           value={formData.buyingPrice} 
                           onChange={e => setFormData({...formData, buyingPrice: e.target.value})} 
                           readOnly={isAddStockMode}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selling Price</label>
                        <input 
                           type="number" 
                           required 
                           className={`w-full px-3 py-2 border rounded-lg ${isAddStockMode ? 'bg-slate-100 text-slate-500' : ''}`}
                           value={formData.price} 
                           onChange={e => setFormData({...formData, price: e.target.value})} 
                           readOnly={isAddStockMode}
                        />
                     </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isAddStockMode ? 'Quantity to Add' : 'Quantity'}</label>
                      <input 
                        type="number" 
                        required 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" 
                        value={formData.quantity} 
                        onChange={e => setFormData({...formData, quantity: e.target.value})} 
                        placeholder={isAddStockMode ? "e.g. 5" : ""}
                      />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-slate-600 font-bold">Cancel</button>
                     <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> {isAddStockMode ? 'Update Stock' : 'Save Item'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-slide-up">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
               <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category Name</label>
                   <input 
                     type="text" 
                     required 
                     autoFocus
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                     value={categoryFormName} 
                     onChange={e => setCategoryFormName(e.target.value)} 
                     placeholder="e.g. Headphones"
                   />
                </div>
                <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-slate-600 font-bold">Cancel</button>
                   <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Voucher View Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white w-[148mm] min-h-[210mm] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:max-w-none print:w-[148mm] print:rounded-none print:static animate-slide-up mx-auto">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white"><FileText className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-800">Sales Voucher</h3>
                  {selectedVoucher.status === 'Refunded' && (
                     <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">REFUNDED</span>
                  )}
                </div>
                <div className="flex gap-2">
                   {selectedVoucher.status !== 'Refunded' && (
                      <button 
                        onClick={() => handleInitiateRefund(selectedVoucher)} 
                        className="px-3 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-red-600 transition-all"
                        title="Refund this voucher"
                      >
                        <RotateCcw className="w-4 h-4" /> Refund
                      </button>
                   )}
                   <button onClick={handlePrintVoucher} className="px-3 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all"><Printer className="w-4 h-4" /> Print / Save PDF</button>
                   <button onClick={() => setSelectedVoucher(null)} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"><X className="w-5 h-5" /></button>
                </div>
             </div>
             
             <div id="voucher-content" className="p-8 bg-white print:p-8 w-[148mm] min-h-[210mm] mx-auto flex flex-col relative">
                {selectedVoucher.status === 'Refunded' && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 text-red-500 font-bold text-6xl opacity-30 rotate-45 p-4 rounded-xl z-0 pointer-events-none">
                      REFUNDED
                   </div>
                )}
                
                <div className="text-center mb-6 border-b-2 border-slate-900 pb-6 relative z-10">
                  <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-slate-900">{BRAND_NAME}</h1>
                  <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-wide">Accessories & Gadgets Store</p>
                  <div className="flex justify-center gap-3 mt-2 text-[9px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {BRAND_ADDRESS}</span>
                    <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {BRAND_CONTACT}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6 relative z-10">
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                     <h4 className="text-lg font-bold text-slate-900">{selectedVoucher.customerName}</h4>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date / ID</p>
                     <p className="font-medium text-slate-700 text-sm">{selectedVoucher.date}</p>
                     <p className="font-mono text-xs text-slate-400">{selectedVoucher.id}</p>
                   </div>
                </div>

                <div className="flex-1 relative z-10">
                   <table className="w-full text-left text-sm">
                      <thead>
                         <tr className="border-b-2 border-slate-200">
                            <th className="py-2 text-[10px] uppercase font-bold text-slate-500">Item</th>
                            <th className="py-2 text-[10px] uppercase font-bold text-slate-500 text-center">Qty</th>
                            <th className="py-2 text-[10px] uppercase font-bold text-slate-500 text-right">Price</th>
                            <th className="py-2 text-[10px] uppercase font-bold text-slate-500 text-right">Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {selectedVoucher.items.map((item, index) => (
                           <tr key={index}>
                              <td className="py-3 font-bold text-slate-800">{item.itemName}</td>
                              <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                              <td className="py-3 text-right text-slate-600">{item.unitPrice?.toLocaleString()}</td>
                              <td className="py-3 text-right font-bold text-slate-900">{item.totalPrice.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                      <tfoot>
                         {(selectedVoucher.subtotal !== undefined && selectedVoucher.subtotal !== selectedVoucher.totalAmount) ? (
                           <>
                             <tr className="border-t-2 border-slate-200">
                                <td colSpan={3} className="pt-3 text-right font-bold text-slate-500 uppercase text-xs">Subtotal</td>
                                <td className="pt-3 text-right font-bold text-slate-700">
                                   {selectedVoucher.subtotal.toLocaleString()}
                                </td>
                             </tr>
                             <tr>
                                <td colSpan={3} className="pt-1 text-right font-bold text-red-500 uppercase text-xs">
                                   Discount {selectedVoucher.discountType === 'percentage' ? `(${selectedVoucher.discountValue}%)` : ''}
                                </td>
                                <td className="pt-1 text-right font-bold text-red-500">
                                   -{(selectedVoucher.subtotal - selectedVoucher.totalAmount).toLocaleString()}
                                </td>
                             </tr>
                             <tr>
                                <td colSpan={3} className="pt-2 text-right font-bold text-slate-800 uppercase text-xs tracking-wider">Grand Total</td>
                                <td className="pt-2 text-right font-bold text-xl text-indigo-700">
                                   {selectedVoucher.totalAmount.toLocaleString()} <span className="text-xs font-bold text-slate-400">MMK</span>
                                </td>
                             </tr>
                           </>
                         ) : (
                           <tr className="border-t-2 border-slate-900">
                              <td colSpan={3} className="pt-4 text-right font-bold text-slate-800 uppercase text-xs tracking-wider">Grand Total</td>
                              <td className="pt-4 text-right font-bold text-xl text-indigo-700">
                                 {selectedVoucher.totalAmount.toLocaleString()} <span className="text-xs font-bold text-slate-400">MMK</span>
                              </td>
                           </tr>
                         )}
                      </tfoot>
                   </table>
                </div>

                <div className="mt-auto pt-8 text-center relative z-10" style={{ paddingBottom: '0.5in' }}>
                   <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap">{settings.footerText}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Security Modal for Refund */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4">
             <div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700">
               <h3 className="text-white font-bold text-lg flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-indigo-400" />
                 Confirm Refund
               </h3>
               <button onClick={() => setIsSecurityModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <form onSubmit={handleSecuritySubmit} className="p-6 space-y-4">
               <div className="text-center">
                  <p className="text-sm text-slate-500 mb-1">You are about to refund Voucher:</p>
                  <p className="font-bold text-slate-800 font-mono">{voucherToRefund?.id}</p>
                  <p className="text-xs text-red-500 mt-2">This will restore stock quantity and mark sales as refunded.</p>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Password</label>
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
                   className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all"
                 >
                   Confirm Refund
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* Security Modal for Inventory Edit/Delete */}
      {isInventorySecurityOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden scale-100 animate-slide-up mx-4">
             <div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700">
               <h3 className="text-white font-bold text-lg flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-indigo-400" />
                 Inventory Security
               </h3>
               <button onClick={() => setIsInventorySecurityOpen(false)} className="text-white/60 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <form onSubmit={handleInventorySecuritySubmit} className="p-6 space-y-4">
               <div className="text-center">
                  <p className="text-sm text-slate-500">
                     Enter security key to <span className="font-bold text-slate-800 uppercase">{inventoryAction}</span> this item.
                  </p>
                  {inventoryActionItem && <p className="font-bold text-indigo-600 mt-1">{inventoryActionItem.name}</p>}
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Security Key</label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input 
                     type="password"
                     autoFocus
                     required
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold"
                     placeholder="Enter security key"
                     value={inventorySecurityKey}
                     onChange={e => setInventorySecurityKey(e.target.value)}
                   />
                 </div>
               </div>

               {inventorySecurityError && (
                 <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-bold text-center animate-fade-in border border-red-100">
                   {inventorySecurityError}
                 </div>
               )}

               <div className="pt-2 flex gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsInventorySecurityOpen(false)}
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
    </div>
  );
};
