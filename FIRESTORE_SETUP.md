# Configurazione Firestore Security Rules

## Problema
Le query Firestore falliscono con errore "Missing or insufficient permissions" perché le regole di sicurezza non sono configurate.

## Soluzione

Il file con le regole complete si trova in: **`scripts/firebase.rules`**

### Opzione 1: Via Firebase Console (Consigliato)

1. Vai alla [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il progetto `mymecanich`
3. Nel menu laterale, vai su **Firestore Database**
4. Clicca sulla tab **Rules** (Regole)
5. Copia e incolla il contenuto del file **`scripts/firebase.rules`** nell'editor
6. Clicca **Publish** (Pubblica)

### Opzione 2: Via Firebase CLI

```bash
# Installa Firebase CLI se non l'hai già
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inizializza Firebase nel progetto (se non già fatto)
firebase init firestore

# Deploy delle regole (assicurati che firebase.json punti a scripts/firebase.rules)
firebase deploy --only firestore:rules
```

### Opzione 3: Deploy Manuale

Se `firebase.json` non è configurato:

```bash
# Deploy specificando il file manualmente
firebase deploy --only firestore:rules --config scripts/firebase.rules
```

## Verifica

Dopo aver applicato le regole, le seguenti operazioni dovrebbero funzionare:

- ✅ Creazione richieste di visualizzazione veicolo
- ✅ Lettura delle proprie richieste
- ✅ Lettura delle richieste ricevute per i propri veicoli
- ✅ Approvazione/rifiuto richieste
- ✅ Accesso ai dati dei veicoli approvati

## Regole Principali

### Nuove Regole Aggiunte (Vehicle View System)

#### Vehicle View Requests
- **Create**: Chiunque autenticato può creare una richiesta
- **Read**: Solo il proprietario del veicolo o il richiedente
- **Update**: Solo il proprietario del veicolo (per approvare/rifiutare)
- **Delete**: Solo il proprietario del veicolo

#### Vehicle View Logs
- **Read**: Solo l'utente coinvolto nel log
- **Create**: Utenti autenticati (per audit trail)
- **Update/Delete**: Non permesso (solo audit)

#### Car Transfer Requests (legacy)
- **Read**: Mittente o destinatario
- **Create**: Utenti autenticati
- **Update**: Mittente o destinatario
- **Delete**: Solo il mittente

#### Transfer Logs
- **Read**: Utenti coinvolti nel trasferimento
- **Create**: Utenti autenticati
- **Update/Delete**: Non permesso (solo audit)

### Regole Esistenti (Aggiornate)

#### Vehicles
- **Read**: Chiunque autenticato (necessario per ricerca veicoli)
- **Create**: Solo per se stessi
- **Update/Delete**: Solo il proprietario del veicolo

#### Maintenance Records
- **Read**: Proprietario, meccanico o proprietario del veicolo
- **Create**: Proprietario del veicolo o meccanico
- **Update/Delete**: Proprietario o chi ha creato il record

## Troubleshooting

Se continui a ricevere errori di permessi:

1. Verifica di essere autenticato nell'app
2. Controlla che l'email dell'utente sia verificata
3. Verifica che le regole siano state pubblicate correttamente
4. Controlla i log di Firebase Console → Firestore → Usage

## Note di Sicurezza

Le regole attuali permettono a qualsiasi utente autenticato di:
- Leggere tutti i veicoli (necessario per la ricerca)
- Creare richieste di visualizzazione
- Leggere solo le proprie richieste o quelle per i propri veicoli

Per maggiore sicurezza in produzione, considera di:
- Limitare la lettura dei veicoli solo a quelli pubblici o con permessi specifici
- Aggiungere rate limiting
- Implementare validazione dei dati più stringente
