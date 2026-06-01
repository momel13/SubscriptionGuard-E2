import express from 'express';
import { supabase } from '../supabase.ts';
import { buildDashboardPayload } from '../mappers/dashboardMapper.ts';

const router = express.Router();

router.get('/dashboard', async (_, res) => {
  try {
    const [
      categoriesResult,
      subscriptionsResult,
      notificationsResult,
    ] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('notifications').select('*'),
    ]);

    if (
      categoriesResult.error ||
      subscriptionsResult.error ||
      notificationsResult.error
    ) {
      return res.status(500).json({
        error:
          categoriesResult.error?.message ||
          subscriptionsResult.error?.message ||
          notificationsResult.error?.message,
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
      error: 'Server error',
    });
  }
});

export default router;
