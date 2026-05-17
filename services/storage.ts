export const StorageKeys = {
  TICKETS: 'hhs_repair_tickets',
  TRANSACTIONS: 'hhs_finance_transactions',
  CATEGORIES: 'hhs_finance_categories',
  MOBILE_STOCK: 'hhs_mobile_stock',
  INSTALLMENTS: 'hhs_installments',
  REPAIR_SETTINGS: 'hhs_repair_settings',
  REPAIR_ERRORS: 'hhs_repair_errors',
  ACCESSORIES_INVENTORY: 'hhs_accessories_inventory',
  ACCESSORIES_SALES: 'hhs_accessories_sales',
  ACCESSORIES_CATEGORIES: 'hhs_accessories_categories',
  ACCESSORIES_VOUCHERS: 'hhs_accessories_vouchers',
  ACCESSORIES_SETTINGS: 'hhs_accessories_settings'
};

export const loadData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return defaultValue;
  }
};

export const saveData = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
  }
};

export const getStorageUsage = (): string => {
   if (typeof window === 'undefined') return '0 KB';
   let total = 0;
   for (let x in localStorage) {
       if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
           total += (localStorage[x].length * 2);
       }
   }
   return (total / 1024).toFixed(2) + " KB";
};

export const clearDatabase = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(StorageKeys.TICKETS);
  localStorage.removeItem(StorageKeys.TRANSACTIONS);
  localStorage.removeItem(StorageKeys.CATEGORIES);
  localStorage.removeItem(StorageKeys.MOBILE_STOCK);
  localStorage.removeItem(StorageKeys.INSTALLMENTS);
  localStorage.removeItem(StorageKeys.REPAIR_SETTINGS);
  localStorage.removeItem(StorageKeys.REPAIR_ERRORS);
  localStorage.removeItem(StorageKeys.ACCESSORIES_INVENTORY);
  localStorage.removeItem(StorageKeys.ACCESSORIES_SALES);
  localStorage.removeItem(StorageKeys.ACCESSORIES_CATEGORIES);
  localStorage.removeItem(StorageKeys.ACCESSORIES_VOUCHERS);
  localStorage.removeItem(StorageKeys.ACCESSORIES_SETTINGS);
  window.location.reload();
}

export const createFullBackup = (filenamePrefix: string = 'HHS_DATA') => {
  if (typeof window === 'undefined') return;
  
  const tickets = loadData(StorageKeys.TICKETS, []);
  const transactions = loadData(StorageKeys.TRANSACTIONS, []);
  const categories = loadData(StorageKeys.CATEGORIES, []);
  const mobileStock = loadData(StorageKeys.MOBILE_STOCK, []);
  const installments = loadData(StorageKeys.INSTALLMENTS, []);
  const repairErrors = loadData(StorageKeys.REPAIR_ERRORS, []);
  const accessoriesInventory = loadData(StorageKeys.ACCESSORIES_INVENTORY, []);
  const accessoriesSales = loadData(StorageKeys.ACCESSORIES_SALES, []);
  const accessoriesCategories = loadData(StorageKeys.ACCESSORIES_CATEGORIES, []);
  const accessoriesVouchers = loadData(StorageKeys.ACCESSORIES_VOUCHERS, []);
  const accessoriesSettings = loadData(StorageKeys.ACCESSORIES_SETTINGS, { footerText: "Thank you for shopping with us!" });
  
  const data = JSON.stringify({
    version: '1.0',
    type: 'full_backup',
    timestamp: new Date().toISOString(),
    tickets,
    transactions,
    categories,
    mobileStock,
    installments,
    repairErrors,
    accessoriesInventory,
    accessoriesSales,
    accessoriesCategories,
    accessoriesVouchers,
    accessoriesSettings
  }, null, 2);

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};