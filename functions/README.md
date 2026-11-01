# Cloud Functions di MyMechanic

**Stato: disattivata.** Per attivarla, oltre ai passi qui sotto:

- in `firebase.json` aggiungi prima del deploy:
  ```json
  "functions": { "source": "functions", "runtime": "nodejs22", "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"] }
  ```
- in `src/config/features.ts` imposta `AI_PART_ANALYSIS_ENABLED` a `true`;
- cita l'invio delle foto ad Anthropic nell'informativa privacy.


Contiene `analyzePartPhoto` (regione `europe-west1`): legge i dati di un ricambio da una foto e precompila la scheda del magazzino. Solo per i meccanici autenticati. La chiave API sta in Secret Manager, mai nel codice o nell'app.

## Attivazione

1. Passa il progetto Firebase `mymecanich` al piano **Blaze** (console Firebase, Utilizzo e fatturazione): le Cloud Functions lo richiedono.
2. Salva la chiave Anthropic come secret (la chiede a terminale):

   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```

3. Installa e pubblica, dalla cartella principale del repository:

   ```bash
   npm --prefix functions install
   firebase deploy --only functions
   ```

4. Pubblica le regole Firestore, che chiudono `ai_usage` ai client:

   ```bash
   npm run firebase:deploy:rules
   ```

Finché la funzione non è pubblicata l'app mostra un errore sotto il pulsante e il form manuale continua a funzionare.

## Limite giornaliero

Ogni officina ha 100 analisi al giorno (giorno UTC), contate in `ai_usage/{uid}_{YYYY-MM-DD}`. Il contatore sale prima della chiamata, quindi conta anche le analisi fallite.

Per cambiarlo, modifica `DAILY_LIMIT` in `src/index.ts` e ripeti `firebase deploy --only functions`.

## Privacy

Le foto vengono inviate ad Anthropic per l'analisi. La funzione non le salva. Va indicato nell'informativa privacy dell'app.

## Sviluppo

```bash
npm --prefix functions run build
```
