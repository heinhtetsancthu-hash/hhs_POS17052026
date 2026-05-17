import React from 'react';
import { ServiceItem } from '../types';

interface ServiceCardProps {
  service: ServiceItem;
  onClick: (service: ServiceItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  return (
    <button
      onClick={() => onClick(service)}
      className="group relative flex flex-col items-center text-center justify-center w-full p-8 rounded-3xl glass-panel overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-indigo-500/10 border-white/50"
    >
      <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${service.color} mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
        <service.icon className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-2xl font-display font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
        {service.title}
      </h3>
    </button>
  );
};