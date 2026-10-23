import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  colorScheme?: 'caramel' | 'emerald' | 'amber' | 'blue' | 'espresso';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  colorScheme = 'espresso',
}) => {
  const schemeStyles = {
    caramel: 'bg-caramel/10 text-caramel border-caramel/20',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    espresso: 'bg-espresso/5 text-espresso border-espresso/10',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-espresso/10 shadow-xs flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold text-espresso/60 tracking-wider uppercase block">
          {label}
        </span>
        <div className="font-serif text-2xl sm:text-3xl font-bold text-espresso mt-1">
          {value}
        </div>
        {subValue && (
          <span className="text-[11px] text-espresso/50 mt-0.5 block font-medium">
            {subValue}
          </span>
        )}
      </div>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${schemeStyles[colorScheme]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
