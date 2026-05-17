
import { LucideIcon } from 'lucide-react';

export enum ServiceType {
  FINANCE = 'Finance',
  MOBILE_SALES = 'Mobile Sales',
  REPAIR_SERVICE = 'Repair Service',
  INSTALLMENT = 'Installment',
  ACCESSORIES_SALES = 'Accessories Sales',
  MONTHLY_REPORT = 'Monthly Report'
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: ServiceType;
  color: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
