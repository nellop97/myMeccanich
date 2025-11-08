# 🔐 Distribuzione Regole Firestore

Le regole di sicurezza Firestore sono state aggiornate per supportare le nuove funzionalità di notifiche in-app e trasferimenti veicoli.

## 🚨 AZIONE RICHIESTA - DISTRIBUIRE IMMEDIATAMENTE

**❌ I trasferimenti veicolo NON funzioneranno fino alla distribuzione delle regole!**

### Errori che verranno risolti dopo la distribuzione:
- ❌ `TransferService.ts:346 Error transferring maintenance records: Missing or insufficient permissions`
- ❌ `TransferService.ts:305 Error transferring vehicle data: Missing or insufficient permissions`
- ❌ `TransferService.ts:220 Error accepting transfer: Missing or insufficient permissions`
- ❌ `TransferService.ts:182 Error verifying PIN: Missing or insufficient permissions`

## ⚠️ IMPORTANTE

**Le regole Firestore devono essere distribuite manualmente su Firebase Console o tramite Firebase CLI.**

Il file locale `firebase.rules` contiene le regole aggiornate, ma **NON** vengono applicate automaticamente!

**👉 Vai alla sezione "Metodo 1: Firebase Console" qui sotto per distribuire SUBITO.**

---

## 📝 Modifiche Apportate

### Collezioni con Regole di Trasferimento Aggiornate (CRITICO)

⚠️ **AGGIORNAMENTO URGENTE**: Le seguenti collezioni sono state aggiornate per permettere i trasferimenti veicolo:

1. **`vehicles`** - Permesso update durante trasferimento
   - Nuovo: acquirente può aggiornare ownerId durante accettazione
   - Validazione: nuovo ownerId deve corrispondere all'email autenticata

2. **`maintenance_records`** - Permesso update/delete durante trasferimento
   - Acquirente può modificare/eliminare records durante trasferimento
   - ⚠️ Delete temporaneo permissivo (richiede miglioramento sicurezza)

3. **`documents`** - Permesso update/delete durante trasferimento
   - Acquirente può modificare/eliminare documenti durante trasferimento
   - ⚠️ Delete temporaneo permissivo (richiede miglioramento sicurezza)

4. **`vehicle_photos`** - Permesso update/delete durante trasferimento
   - Acquirente può modificare/eliminare foto durante trasferimento
   - ⚠️ Delete temporaneo permissivo (richiede miglioramento sicurezza)

5. **`reminders`** - Permesso update/delete durante trasferimento
   - Acquirente può modificare/eliminare promemoria durante trasferimento
   - ⚠️ Delete temporaneo permissivo (richiede miglioramento sicurezza)

6. **`deadlines`** - Permesso update/delete durante trasferimento
   - Acquirente può modificare/eliminare scadenze durante trasferimento
   - ⚠️ Delete temporaneo permissivo (richiede miglioramento sicurezza)

7. **`activities`** - Permesso update/delete durante trasferimento
   - Acquirente può modificare/eliminare attività durante trasferimento
   - ⚠️ Delete temporaneo permissivo (richiede miglioramento sicurezza)

### Nuove Collezioni Aggiunte (Precedente)

1. **`in_app_notifications`** - Notifiche in-app per trasferimenti veicoli
   - Lettura: solo destinatario (tramite email)
   - Creazione: qualsiasi utente autenticato
   - Aggiornamento: solo destinatario
   - Cancellazione: solo destinatario

2. **`vehicle_transfers`** - Gestione trasferimenti veicoli
   - Lettura: venditore o acquirente
   - Creazione: solo venditore (con validazione campi)
   - Aggiornamento: venditore o acquirente
   - Cancellazione: solo venditore

---

## 🚀 Metodo 1: Firebase Console (Consigliato)

### Passi:

1. **Apri Firebase Console**
   - Vai su: https://console.firebase.google.com
   - Seleziona il progetto: `mymecanich`

2. **Naviga a Firestore Database**
   - Menu laterale → **Firestore Database**
   - Tab → **Regole** (Rules)

3. **Copia le regole dal file locale**
   ```bash
   # Copia il contenuto del file
   cat scripts/firebase.rules
   ```

4. **Incolla nel editor online**
   - Seleziona tutto il contenuto nell'editor online
   - Incolla le nuove regole da `scripts/firebase.rules`

5. **Pubblica le regole**
   - Click su **Pubblica** (Publish)
   - Conferma la distribuzione

6. **Verifica**
   - Le regole sono attive immediatamente dopo la pubblicazione

---

## 🛠️ Metodo 2: Firebase CLI

### Prerequisiti:

```bash
# Installa Firebase CLI (se non già installato)
npm install -g firebase-tools

# Login a Firebase
firebase login
```

### Configurazione Progetto:

1. **Inizializza Firebase nel progetto** (solo prima volta):
   ```bash
   cd /home/user/myMeccanich
   firebase init firestore
   ```

   Durante l'inizializzazione:
   - Seleziona progetto: `mymecanich`
   - Firestore rules file: `scripts/firebase.rules`
   - Firestore indexes file: `firestore.indexes.json` (default)

2. **Distribuisci le regole**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Verifica distribuzione**:
   ```bash
   firebase firestore:rules:get
   ```

---

## ✅ Test delle Regole

Dopo aver distribuito le regole, testa le funzionalità:

### Test 1: Creazione Notifica In-App

```javascript
// Deve avere successo se autenticato
await setDoc(doc(db, 'in_app_notifications', 'test-id'), {
  userId: 'test@example.com',
  type: 'transfer_request',
  title: 'Test',
  message: 'Test message',
  read: false,
  priority: 'high',
  createdAt: Timestamp.now()
});
```

### Test 2: Creazione Trasferimento

```javascript
// Deve avere successo se sellerId == auth.uid
await setDoc(doc(db, 'vehicle_transfers', 'test-transfer'), {
  vehicleId: 'vehicle-123',
  sellerId: auth.currentUser.uid,  // Deve essere uguale all'UID autenticato
  sellerEmail: 'seller@example.com',
  buyerEmail: 'buyer@example.com',
  transferPin: 'hashed-pin',
  status: 'pending',
  createdAt: Timestamp.now()
});
```

---

## 🔍 Risoluzione Problemi

### Errore: "Missing or insufficient permissions"

**Causa**: Le regole non sono state distribuite o sono errate

**Soluzione**:
1. Verifica che le regole siano state pubblicate su Firebase Console
2. Controlla che `auth.currentUser.uid` esista (utente autenticato)
3. Verifica che `sellerId` nel documento sia uguale a `auth.uid`

### Errore: "PERMISSION_DENIED"

**Causa**: L'utente non ha i permessi per l'operazione

**Soluzione**:
1. Verifica che l'utente sia autenticato (`isAuthenticated()`)
2. Per notifiche: verifica che `userId` sia l'email dell'utente autenticato
3. Per trasferimenti: verifica che `sellerId` sia l'UID dell'utente autenticato

### Debug Regole in Console

Firebase Console → Firestore Database → Regole → **Simulatore Regole**

Puoi testare le regole direttamente nell'editor:
- Tipo operazione: `get`, `create`, `update`, `delete`
- Percorso documento: `/in_app_notifications/test-id`
- Autenticazione simulata: UID e email

---

## 📌 Note Importanti

1. **Backup**: Le regole precedenti vengono salvate automaticamente da Firebase
2. **Rollback**: Puoi ripristinare regole precedenti dalla Console
3. **Sicurezza**: Le regole sono critiche per la sicurezza - testa sempre prima!
4. **Propagazione**: Le regole sono attive immediatamente dopo la pubblicazione

---

## 🔗 Risorse Utili

- [Firebase Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Testing Firestore Security Rules](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## ✨ Checklist Post-Distribuzione

- [ ] Regole distribuite su Firebase Console o CLI
- [ ] Testato creazione notifica in-app
- [ ] Testato creazione trasferimento veicolo
- [ ] Verificato che gli errori di permessi siano risolti
- [ ] Testato su ambiente di produzione
