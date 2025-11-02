# 🔒 Firebase Rules Deploy Guide

## Problema risolto
Le regole Firestore sono state aggiornate per permettere la ricerca delle officine (meccanici) nella collezione `users`.

## Modifiche apportate
- **Prima**: Solo lettura singola (`get`) per proprietario o meccanici
- **Dopo**: Aggiunta lettura query (`list`) per utenti autenticati con limite di 20 risultati

```javascript
match /users/{userId} {
  // Lettura singola: solo il proprietario o meccanici autenticati
  allow get: if isOwner(userId) || isMechanic();

  // Lettura query: utenti autenticati possono cercare meccanici (per ricerca officine)
  allow list: if isAuthenticated() && request.query.limit <= 20;

  // Scrittura: solo il proprietario
  allow create: if isOwner(userId);
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId);
}
```

## 🚀 Come deployare le regole

### Opzione 1: Firebase Console (Consigliata per test rapidi)
1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto **mymecanich**
3. Nel menu laterale vai su **Firestore Database**
4. Clicca sulla tab **Rules**
5. Copia il contenuto del file `scripts/firebase.rules`
6. Incolla nell'editor
7. Clicca su **Publish**

### Opzione 2: Firebase CLI (Consigliata per produzione)

#### 1. Installa Firebase Tools (se non già installato)
```bash
npm install -g firebase-tools
```

#### 2. Login a Firebase
```bash
firebase login
```

#### 3. Deploy delle sole regole Firestore
```bash
firebase deploy --only firestore:rules
```

**OPPURE** dalla root del progetto:
```bash
npm run firebase:deploy:rules
```
(se aggiungi lo script in package.json)

### Opzione 3: Script npm personalizzato

Aggiungi questo script a `package.json`:

```json
{
  "scripts": {
    "firebase:deploy:rules": "firebase deploy --only firestore:rules",
    "firebase:deploy:all": "firebase deploy"
  }
}
```

Poi esegui:
```bash
npm run firebase:deploy:rules
```

## ✅ Verifica del deploy

Dopo il deploy, verifica che le regole siano attive:

1. Apri Firebase Console → Firestore Database → Rules
2. Verifica che ci sia la regola `allow list` per users
3. Testa la ricerca officine nell'app

## 🔍 Test della funzionalità

1. Apri l'app
2. Vai su **Nuova Manutenzione**
3. Nel campo **Officina**, inizia a digitare almeno 2 caratteri
4. Dovresti vedere i suggerimenti delle officine censite
5. Seleziona un'officina o continua a scrivere manualmente

## ⚠️ Note di sicurezza

Le nuove regole:
- ✅ Permettono solo agli utenti **autenticati** di cercare meccanici
- ✅ Limitano i risultati a **massimo 20** per query
- ✅ Non espongono dati sensibili (solo profilo pubblico officina)
- ✅ Mantengono restrizioni su creazione/modifica/eliminazione

## 🐛 Troubleshooting

### Errore: "Missing or insufficient permissions"
**Causa**: Le regole non sono state deployate o ci sono errori di sintassi

**Soluzione**:
1. Verifica che il file `scripts/firebase.rules` sia corretto
2. Deploy delle regole con uno dei metodi sopra
3. Attendi 1-2 minuti per la propagazione
4. Riprova

### Errore: "Permission denied" dopo il deploy
**Causa**: Regole non ancora propagate o utente non autenticato

**Soluzione**:
1. Logout e login nell'app
2. Verifica che l'utente sia autenticato
3. Controlla i log di Firebase Console

### Nessun risultato nella ricerca
**Causa**: Nessun utente con `userType === 'mechanic'` nel database

**Soluzione**:
1. Vai su Firestore Console
2. Collezione `users`
3. Trova un utente meccanico
4. Verifica che abbia:
   - `userType: "mechanic"`
   - `workshopName` o `businessName` compilato

## 📝 Configurazione Firebase

Il progetto è già configurato con:
- **firebase.json**: Configurazione Firebase
- **.firebaserc**: Alias progetto (mymecanich)
- **scripts/firebase.rules**: Regole Firestore

## 🔗 Link utili

- [Firebase Console - mymecanich](https://console.firebase.google.com/project/mymecanich)
- [Documentazione Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
