import express from 'express';
import { getAuthContext, isLocalDemoAuth } from '../auth.js';
import { ensureDefaultCategories } from '../defaults.js';
import { getDemoDashboard } from '../demoStore.js';
import { buildDashboardPayload } from '../mappers/dashboardMapper.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const auth = await getAuthContext(req, res);
    if (!auth) return;

    if (isLocalDemoAuth(auth)) {
      return res.json(buildDashboardPayload(getDemoDashboard(auth.userId)));
    }

    const categoriesResult = await ensureDefaultCategories(auth.db);
    const subscriptionsResult = await auth.db
      .from('subscriptions')
      .select('*')
      .eq('user_id', auth.userId);

    let notificationsResult: {
      data: any[] | null;
      error: { message: string } | null;
    } = {
      data: [],
      error: null,
    };

    const subscriptionIds = (subscriptionsResult.data || []).map((subscription) => subscription.id);

    if (subscriptionIds.length > 0) {
      notificationsResult = await auth.db
        .from('notifications')
        .select('*')
        .in('subscription_id', subscriptionIds);
    }

    if (
      categoriesResult.error ||
      subscriptionsResult.error ||
      notificationsResult.error
    ) {
      return res.status(500).json({
        errors: [
          categoriesResult.error?.message ||
          subscriptionsResult.error?.message ||
          notificationsResult.error?.message ||
          'Dashboard konnte nicht geladen werden.',
        ],
      });
    }

    const payload = buildDashboardPayload({
      categories: categoriesResult.data || [],
      subscriptions: subscriptionsResult.data || [],
      notifications: notificationsResult.data || [],
      budgetTarget: 80,
    });

    res.json(payload);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      errors: ['Server error'],
    });
  }
});

export default router;
