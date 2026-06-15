import express from 'express';
import { getAuthContext, isLocalDemoAuth } from '../auth.js';
import { DEFAULT_CATEGORIES, ensureDefaultCategories } from '../defaults.js';
import { createDemoSubscription } from '../demoStore.js';
import { mapSubscription } from '../mappers/dashboardMapper.js';

const router = express.Router();

const VALID_INTERVALS = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
const VALID_USAGE_RATINGS = ['OFTEN', 'RARELY', 'NEVER', 'NOT_RATED'];

function validateSubscriptionPayload(payload: Record<string, unknown>) {
  const errors: string[] = [];

  if (typeof payload.name !== 'string' || payload.name.trim() === '') {
    errors.push('Name ist ein Pflichtfeld.');
  }

  if (typeof payload.provider !== 'string' || payload.provider.trim() === '') {
    errors.push('Anbieter ist ein Pflichtfeld.');
  }

  if (typeof payload.categoryId !== 'number' || !Number.isInteger(payload.categoryId)) {
    errors.push('Kategorie ist ein Pflichtfeld.');
  }

  if (typeof payload.cost !== 'number' || !Number.isFinite(payload.cost) || payload.cost <= 0) {
    errors.push('Kosten müssen eine positive Zahl sein.');
  }

  if (typeof payload.interval !== 'string' || !VALID_INTERVALS.includes(payload.interval)) {
    errors.push('Intervall ist ungültig.');
  }

  if (
    payload.usageRating !== undefined &&
    (typeof payload.usageRating !== 'string' || !VALID_USAGE_RATINGS.includes(payload.usageRating))
  ) {
    errors.push('Nutzungsbewertung ist ungültig.');
  }

  return errors;
}

function buildInsertPayload(payload: Record<string, unknown>, userId: string, useIntervalColumn = false) {
  const intervalField = useIntervalColumn
    ? { interval: payload.interval }
    : { payment_interval: payload.interval };

  return {
    user_id: userId,
    category_id: payload.categoryId,
    name: String(payload.name).trim(),
    provider: String(payload.provider).trim(),
    cost: payload.cost,
    currency: payload.currency || 'EUR',
    ...intervalField,
    start_date: payload.startDate || new Date().toISOString().slice(0, 10),
    cancel_deadline: payload.cancelDeadline || null,
    contract_end: payload.contractEnd || null,
    auto_renewal: payload.autoRenewal ?? false,
    usage_rating: payload.usageRating || 'NOT_RATED',
    is_paused: payload.isPaused ?? false,
  } as Record<string, unknown>;
}

function shouldRetryWithIntervalColumn(message: string) {
  return /payment_interval|schema cache|column/i.test(message);
}

router.post('/', async (req, res) => {
  const auth = await getAuthContext(req, res);
  if (!auth) return;

  const payload = req.body as Record<string, unknown>;
  const validationErrors = validateSubscriptionPayload(payload);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      errors: validationErrors,
    });
  }

  if (isLocalDemoAuth(auth)) {
    const categoryExists = DEFAULT_CATEGORIES.some((category) => category.id === payload.categoryId);

    if (!categoryExists) {
      return res.status(400).json({
        errors: ['Die gewählte Kategorie existiert nicht. Lade die Seite neu und versuche es erneut.'],
      });
    }

    const subscription = createDemoSubscription(payload, auth.userId);

    return res.status(201).json({
      message: 'Abo im lokalen Backend-Demo-Modus gespeichert.',
      subscription: mapSubscription(subscription),
    });
  }

  const categoriesResult = await ensureDefaultCategories(auth.db);

  if (categoriesResult.error) {
    return res.status(500).json({
      errors: [`Kategorien konnten nicht geladen werden: ${categoriesResult.error.message}`],
    });
  }

  const categoryExists = categoriesResult.data?.some((category) => category.id === payload.categoryId);

  if (!categoryExists) {
    return res.status(400).json({
      errors: ['Die gewählte Kategorie existiert nicht. Lade die Seite neu und versuche es erneut.'],
    });
  }

  let insertResult = await auth.db
    .from('subscriptions')
    .insert(buildInsertPayload(payload, auth.userId) as any)
    .select()
    .single();

  if (insertResult.error && shouldRetryWithIntervalColumn(insertResult.error.message)) {
    insertResult = await auth.db
      .from('subscriptions')
      .insert(buildInsertPayload(payload, auth.userId, true) as any)
      .select()
      .single();
  }

  if (insertResult.error) {
    console.error('Supabase insert failed:', insertResult.error);
    return res.status(500).json({
      errors: [`Das neue Abo konnte nicht gespeichert werden: ${insertResult.error.message}`],
    });
  }

  if (payload.cancelDeadline && insertResult.data?.id) {
    const notificationResult = await auth.db
      .from('notifications')
      .insert({
        subscription_id: insertResult.data.id,
        type: 'CANCEL_DEADLINE_REMINDER',
        trigger_date: payload.cancelDeadline,
        is_sent: false,
        message: `${insertResult.data.name} Kündigungsfrist am ${payload.cancelDeadline}`,
      });

    if (notificationResult.error) {
      console.error('Notification insert failed:', notificationResult.error);
    }
  }

  return res.status(201).json({
    message: 'Abo erfolgreich gespeichert.',
    subscription: mapSubscription(insertResult.data),
  });
});

export default router;
