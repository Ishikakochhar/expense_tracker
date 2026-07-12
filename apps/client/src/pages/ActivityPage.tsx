import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { Receipt, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/hooks/useI18n';

export function ActivityPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();

  const { data: activity = [], isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get('/activity').then((res) => res.data.data),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display-lg text-3xl md:text-4xl text-primary mb-2">{t('activity.title')}</h1>
          <p className="font-body-md text-on-surface-variant">{t('activity.subtitle')}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-6 sm:p-8">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-container rounded-xl"></div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-outline-variant mx-auto mb-4" />
            <p className="font-headline-md text-primary">{t('activity.empty')}</p>
            <p className="font-body-md text-on-surface-variant">{t('activity.emptySubtitle')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activity.map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 hover:bg-surface-container transition-colors rounded-xl border border-transparent hover:border-outline-variant/30">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'EXPENSE' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                    {item.type === 'EXPENSE' ? (
                      <Receipt className="w-6 h-6" />
                    ) : (
                      <ArrowRight className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-headline-md text-lg text-primary leading-tight">
                      {item.type === 'EXPENSE' ? item.description : t('activity.settledUp')}
                    </p>
                    <p className="font-body-md text-sm text-on-surface-variant">
                      {item.groupName} • {format(new Date(item.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto pl-16 sm:pl-0">
                  <p className="font-data-mono text-lg text-primary">
                    {item.currency === 'USD' ? '$' : '₹'}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="font-label-sm text-xs text-on-surface-variant mt-1">
                    {item.type === 'EXPENSE' 
                      ? `${t('activity.paidBy')} ${item.paidByName === user?.name ? t('activity.you') : item.paidByName}`
                      : `${item.fromMemberName === user?.name ? t('activity.you') : item.fromMemberName} ${t('activity.paid')} ${item.toMemberName === user?.name ? t('activity.you') : item.toMemberName}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
