import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRouter from './routes/dashboard.js';
import { supabase } from './supabase.js';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.json({
    status: 'OK',
    message: 'SubscriptionGuard Backend running',
  });
});

app.use('/api', dashboardRouter);


// ==========================================
// TICKET #48: POST /api/subscriptions
// ==========================================
app.post('/api/subscriptions', async (req, res): Promise<any> => {
  try {
    // 1. Auth-Check: Prüfen, ob das Frontend einen Token mitschickt
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Nicht autorisiert. Token fehlt.' });
    }

    // 2. Daten aus dem Frontend entgegennehmen (Das funktioniert dank Zeile 11!)
    const subscriptionPayload = req.body;
    console.log(`Neuer POST-Request empfangen:`, subscriptionPayload);

    // ---------------------------------------------------------
    // TODO #49: subscriptionPayload validieren

    const { name, cost, interval } = subscriptionPayload;

    // 1. Prüfen, ob Pflichtfelder fehlen
    if (!name || cost === undefined || cost === null || !interval) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Validierung fehlgeschlagen: Name, Preis (cost) und Intervall sind Pflichtfelder.'
      });
    }

    // 2. Prüfen, ob der Preis ein gültiges Format hat (Zahl und nicht negativ)
    if (typeof cost !== 'number' || cost < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Validierung fehlgeschlagen: Der Preis muss eine gültige, positive Zahl sein.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({
        error: 'Nicht autorisiert.',
        message: 'Der übergebene Token ist ungültig.',
      });
    }

    const insertPayload = {
      user_id: authData.user.id,
      category_id: subscriptionPayload.categoryId,
      name: subscriptionPayload.name,
      provider: subscriptionPayload.provider,
      cost: subscriptionPayload.cost,
      currency: subscriptionPayload.currency,
      interval: subscriptionPayload.interval,
      start_date: subscriptionPayload.startDate,
      cancel_deadline: subscriptionPayload.cancelDeadline ?? null,
      contract_end: subscriptionPayload.contractEnd ?? null,
      auto_renewal: subscriptionPayload.autoRenewal ?? false,
      usage_rating: subscriptionPayload.usageRating ?? 'NOT_RATED',
      is_paused: subscriptionPayload.isPaused ?? false,
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase-Fehler bei Insert:', error);

      return res.status(500).json({
        error: 'Datenbankfehler',
        message: 'Das neue Abo konnte nicht gespeichert werden.',
      });
    }

    return res.status(201).json({
      message: 'Abo erfolgreich gespeichert.',
      subscription: data,
    });

  } catch (error) {
    console.error('Server-Fehler bei POST /api/subscriptions:', error);
    return res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
