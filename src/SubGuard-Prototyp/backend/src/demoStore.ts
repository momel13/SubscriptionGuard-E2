import { DEFAULT_CATEGORIES } from './defaults.js';

type DemoSubscription = {
  id: number;
  user_id: string;
  category_id: number;
  name: string;
  provider: string;
  cost: number;
  currency: 'EUR' | 'USD' | 'CHF';
  payment_interval: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  start_date: string;
  cancel_deadline: string | null;
  contract_end: string | null;
  auto_renewal: boolean;
  usage_rating: 'OFTEN' | 'RARELY' | 'NEVER' | 'NOT_RATED';
  is_paused: boolean;
};

type DemoNotification = {
  id: number;
  subscription_id: number;
  type: string;
  trigger_date: string;
  is_sent: boolean;
  message: string;
};

let nextSubscriptionId = 1;
let nextNotificationId = 1;
const subscriptions: DemoSubscription[] = [];
const notifications: DemoNotification[] = [];

export function getDemoDashboard(userId: string) {
  const userSubscriptions = subscriptions.filter((subscription) => subscription.user_id === userId);
  const subscriptionIds = new Set(userSubscriptions.map((subscription) => subscription.id));

  return {
    categories: DEFAULT_CATEGORIES,
    subscriptions: userSubscriptions,
    notifications: notifications.filter((notification) => subscriptionIds.has(notification.subscription_id)),
    importCandidates: [],
    budgetTarget: 80,
  };
}

export function createDemoSubscription(payload: Record<string, unknown>, userId: string) {
  const subscription: DemoSubscription = {
    id: nextSubscriptionId,
    user_id: userId,
    category_id: Number(payload.categoryId),
    name: String(payload.name),
    provider: String(payload.provider),
    cost: Number(payload.cost),
    currency: (payload.currency || 'EUR') as DemoSubscription['currency'],
    payment_interval: payload.interval as DemoSubscription['payment_interval'],
    start_date: String(payload.startDate || new Date().toISOString().slice(0, 10)),
    cancel_deadline: payload.cancelDeadline ? String(payload.cancelDeadline) : null,
    contract_end: payload.contractEnd ? String(payload.contractEnd) : null,
    auto_renewal: Boolean(payload.autoRenewal),
    usage_rating: (payload.usageRating || 'NOT_RATED') as DemoSubscription['usage_rating'],
    is_paused: Boolean(payload.isPaused),
  };

  nextSubscriptionId += 1;
  subscriptions.push(subscription);

  if (subscription.cancel_deadline) {
    notifications.push({
      id: nextNotificationId,
      subscription_id: subscription.id,
      type: 'CANCEL_DEADLINE_REMINDER',
      trigger_date: subscription.cancel_deadline,
      is_sent: false,
      message: `${subscription.name} Kündigungsfrist am ${subscription.cancel_deadline}`,
    });
    nextNotificationId += 1;
  }

  return subscription;
}
