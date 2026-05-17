
import { Smartphone, Wrench, CreditCard, Banknote, Headphones, BarChart3 } from 'lucide-react';
import { ServiceItem, ServiceType } from './types';

export const BRAND_NAME = "Hein Htet San";
export const BRAND_ADDRESS = "Myothit Street , Htantabin , Bago";
export const BRAND_CONTACT = "09768747313";

export const SERVICES: ServiceItem[] = [
  {
    id: 'finance',
    title: 'Finance',
    description: '',
    icon: Banknote,
    type: ServiceType.FINANCE,
    color: 'from-emerald-400 to-green-500'
  },
  {
    id: 'mobile-sales',
    title: 'Mobile Sales',
    description: '',
    icon: Smartphone,
    type: ServiceType.MOBILE_SALES,
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'accessories',
    title: 'Accessories Sales',
    description: '',
    icon: Headphones,
    type: ServiceType.ACCESSORIES_SALES,
    color: 'from-cyan-400 to-teal-500'
  },
  {
    id: 'repair',
    title: 'Repair Service',
    description: '',
    icon: Wrench,
    type: ServiceType.REPAIR_SERVICE,
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 'installment',
    title: 'Installment',
    description: '',
    icon: CreditCard,
    type: ServiceType.INSTALLMENT,
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 'monthly-report',
    title: 'Monthly Report',
    description: '',
    icon: BarChart3,
    type: ServiceType.MONTHLY_REPORT,
    color: 'from-slate-700 to-slate-900'
  }
];

export const AI_SYSTEM_INSTRUCTION = `
You are the virtual assistant for "${BRAND_NAME}".
Address: ${BRAND_ADDRESS}
Contact: ${BRAND_CONTACT}

Services: Finance, Mobile Sales, Accessories Sales, Repair Service, Installment.

Keep responses very short and direct.
`;
