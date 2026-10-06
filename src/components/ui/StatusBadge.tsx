import React from 'react';
import {
  AlertCircle,
  Clock,
  AlertTriangle,
  MinusCircle,
  CheckCircle2
} from 'lucide-react';
import { DocumentStatusType, Language } from '../../types';

interface StatusBadgeProps {
  status: DocumentStatusType;
  lang: Language;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  lang,
  className = '',
  showIcon = true,
}) => {
  const configs: Record<
    DocumentStatusType,
    {
      labelEn: string;
      labelBn: string;
      icon: React.ReactNode;
      containerClass: string;
      badgeType: string;
    }
  > = {
    MISSING: {
      labelEn: 'Missing',
      labelBn: 'অনুপস্থিত (Missing)',
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
      containerClass:
        'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800',
      badgeType: 'blocking-missing',
    },
    EXPIRY_NEEDED: {
      labelEn: 'Expiry date needed',
      labelBn: 'মেয়াদ প্রয়োজন (Expiry Needed)',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
      containerClass:
        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
      badgeType: 'blocking-expiry-needed',
    },
    EXPIRED: {
      labelEn: 'Expired',
      labelBn: 'মেয়াদ উত্তীর্ণ (Expired)',
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
      containerClass:
        'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
      badgeType: 'blocking-expired',
    },
    NOT_PROVIDED: {
      labelEn: 'Not provided',
      labelBn: 'প্রদান করা হয়নি (Not provided)',
      icon: <MinusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
      containerClass:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
      badgeType: 'optional-skipped',
    },
    OK: {
      labelEn: 'OK',
      labelBn: 'সঠিক (OK)',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
      containerClass:
        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
      badgeType: 'valid-ok',
    },
  };

  const config = configs[status];
  const label = lang === 'bn' ? config.labelBn : config.labelEn;

  return (
    <span
      role="status"
      data-status={status}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.containerClass} ${className}`}
    >
      {showIcon && config.icon}
      <span>{label}</span>
    </span>
  );
};
