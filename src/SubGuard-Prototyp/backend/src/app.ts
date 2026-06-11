import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRouter from './routes/dashboard.js';
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
    // TODO #50: Mit eurer 'supabase.ts' die Daten in die DB schreiben
    // ---------------------------------------------------------

    // 3. Erfolgreiche Antwort ans Frontend senden
    return res.status(201).json({
      message: 'Route steht! Daten erfolgreich im Backend empfangen.',
      receivedData: subscriptionPayload
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
