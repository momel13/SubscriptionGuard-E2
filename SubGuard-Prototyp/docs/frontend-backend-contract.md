# Frontend-/Backend-Übergabe

Der Prototyp bleibt ein statisches Frontend, ist aber auf das Zielbild aus `architecture.adoc` und `design.adoc` ausgerichtet: React/Vite/Mantine kann später daraus entstehen, die fachlichen Begriffe und UI-Flows sind bereits gleich gehalten.

## Integrationspunkt im Prototyp

Vor `app.js` kann das Backend-Team eine Datenquelle registrieren. Im Zielsystem soll diese Datenquelle den REST-/JSON-Client kapseln. Supabase ist Datenbank/Auth des Backends; das Frontend sollte fachliche Daten nicht direkt aus Tabellen lesen.

```html
<script>
window.SubGuardDataSource = {
  name: 'REST API',
  async loadDashboard() {
    return fetch('/api/dashboard').then((response) => response.json());
  }
};
</script>
<script src="app.js"></script>
```

Supabase Auth darf im finalen Frontend clientseitig genutzt werden. `service_role` oder Secret Keys gehören nie in Browser-Code.

## Erwartetes Dashboard-Payload

```ts
type DashboardPayload = {
  categories: Category[];
  subscriptions: Subscription[];
  notifications: Notification[];
  importCandidates?: ImportCandidate[];
  budgetTarget: number;
};

type Category = {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
};

type Subscription = {
  id: number;
  categoryId: number;
  name: string;
  provider: string;
  cost: number;
  currency: 'EUR' | 'USD' | 'CHF';
  interval: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  cancelDeadline: string | null;
  contractEnd: string | null;
  autoRenewal: boolean;
  usageRating: 'OFTEN' | 'RARELY' | 'NEVER' | 'NOT_RATED';
  isPaused: boolean;
};

type Notification = {
  id: number | string;
  icon: string;
  color: 'red' | 'yellow' | 'brand';
  msg: string;
  meta: string;
  unread: boolean;
};

type ImportCandidate = {
  id: number | string;
  provider: string;
  amount: number;
  interval: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  categoryId: number;
  confidence: number;
};
```

## Wichtige Frontend-Flows

- F1/F2: Abo-Liste plus Formular mit Kategorie, Vertragsdaten, Kündigungsfrist, Auto-Renewal, Nutzung, Pause und Löschen.
- F3/F5: Dashboard und Analyse visualisieren Monatskosten, Jahresprojektion, Kategorien und Empfehlungen.
- F4: Notification Center bleibt immer sichtbar; Browser Push ist optional.
- F6: CSV-Import zeigt Kandidaten, die bestätigt oder verworfen werden.
- F7: Budgetstatus zeigt `WITHIN_BUDGET`/`OVER_BUDGET` visuell; final sollte `/api/budget/status` die Status-Union liefern.
- F8: Settings enthalten Währung, Erinnerungsvorlauf, Benachrichtigungszeit und Backup/Sync.

## Backend-Notizen

- API-Responses verwenden camelCase; SQL bleibt snake_case.
- Kategorien kommen aus dem Backend und sind nicht mehr hart im Frontend verdrahtet.
- CSV-Rohdaten werden im Frontend nicht persistiert.
- Backend-Validierung bleibt verbindlich; Frontend-Validierung ist nur UX.
- Supabase-Tabellen in exposed schemas brauchen RLS, und Views sollten RLS nicht umgehen.
