type CategoryRow = {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
};

type SubscriptionRow = {
  id: number;
  user_id?: string;
  category_id: number;
  name: string;
  provider: string;
  cost: string | number;
  currency: 'EUR' | 'USD' | 'CHF';
  payment_interval?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  interval?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  start_date: string | Date;
  cancel_deadline: string | Date | null;
  contract_end: string | Date | null;
  auto_renewal: boolean;
  usage_rating: 'OFTEN' | 'RARELY' | 'NEVER' | 'NOT_RATED';
  is_paused: boolean;
};

type NotificationRow = {
  id: number | string;
  type: string;
  trigger_date: string | Date;
  is_sent: boolean;
  message: string;
};

function formatDate(value: string | Date | null): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  return value;
}

export function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
  };
}

export function mapSubscription(row: SubscriptionRow) {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    name: row.name,
    provider: row.provider,
    cost: Number(row.cost),
    currency: row.currency,
    interval: row.payment_interval ?? row.interval,
    startDate: formatDate(row.start_date),
    cancelDeadline: formatDate(row.cancel_deadline),
    contractEnd: formatDate(row.contract_end),
    autoRenewal: row.auto_renewal,
    usageRating: row.usage_rating,
    isPaused: row.is_paused,
  };
}

export function mapNotification(row: NotificationRow) {
  return {
    id: row.id,
    icon: row.type === 'BUDGET_WARNING' ? '⚠️' : '⏰',
    color: row.type === 'BUDGET_WARNING' ? 'yellow' : 'red',
    msg: row.message,
    meta: `${row.type} · ${formatDate(row.trigger_date)}`,
    unread: !row.is_sent,
  };
}

export function buildDashboardPayload(params: {
  categories: CategoryRow[];
  subscriptions: SubscriptionRow[];
  notifications?: NotificationRow[];
  budgetTarget?: number;
}) {
  return {
    categories: params.categories.map(mapCategory),
    subscriptions: params.subscriptions.map(mapSubscription),
    notifications: params.notifications?.map(mapNotification) ?? [],
    importCandidates: [],
    budgetTarget: params.budgetTarget ?? 80,
  };
}
