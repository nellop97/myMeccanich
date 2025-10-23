# 🐛 Debug Guide - Errore 400 Firestore

## Problema Attuale
Errore 400 Bad Request quando si salva una manutenzione in Firestore.

## 🔍 Come Debuggare

### 1. **Guarda i log della console**

Ho aggiunto logging dettagliato. Quando provi a salvare una manutenzione, vedrai nella console:

```
=== ADDMAINTENANCE DEBUG ===
Form values: { ... }
Maintenance data to send: { ... }
Data types: ...
=== END ADDMAINTENANCE DEBUG ===

=== MAINTENANCE RECORD DEBUG ===
Original record: { ... }
Cleaned record: { ... }
Field "vehicleId": string ...
Field "ownerId": string ...
Field "type": string ...
...
=== END DEBUG ===
```

### 2. **Cosa Controllare nei Log**

Cerca questi problemi comuni:

#### ❌ Valori NaN
```javascript
Field "cost": number NaN  // ❌ PROBLEMA!
Field "cost": number 0    // ✅ OK
```

#### ❌ Valori undefined
```javascript
Field "laborCost": undefined  // ❌ PROBLEMA!
// Il campo non dovrebbe comparire se è undefined
```

#### ❌ Timestamp non validi
```javascript
Field "date": object [object Object]  // ❌ Potrebbe essere problema
Field "date": object Timestamp { ... } // ✅ OK
```

#### ❌ Array vuoti
```javascript
parts: []        // ❌ Dovrebbe essere rimosso
documents: []    // ❌ Dovrebbe essere rimosso
```

#### ❌ Stringhe vuote
```javascript
Field "workshopName": string ""  // ❌ Dovrebbe essere rimosso
```

#### ❌ Tipi sbagliati
```javascript
Field "mileage": string "50000"  // ❌ Dovrebbe essere number
Field "mileage": number 50000    // ✅ OK
```

### 3. **Test con Dati Minimali**

Prova a creare una manutenzione con SOLO i campi obbligatori:

1. **Tipo**: Seleziona un tipo (es. "Tagliando")
2. **Descrizione**: Scrivi qualcosa (es. "Test")
3. **Chilometraggio**: Inserisci un numero (es. "50000")
4. **Lascia tutto il resto vuoto**
5. Salva

Se funziona con dati minimali, il problema è in un campo opzionale.

### 4. **Campi Obbligatori per Firestore**

Questi campi DEVONO essere presenti e validi:

```typescript
{
  vehicleId: string,        // ID del veicolo
  ownerId: string,          // ID utente
  type: string,             // 'tagliando' | 'gomme' | etc.
  description: string,      // Descrizione (non vuota)
  date: Timestamp,          // Data Firebase
  mileage: number,          // Numero (non NaN)
  cost: number,             // Numero (può essere 0)
  warranty: boolean,        // true o false
  isVisible: boolean,       // true o false
}
```

### 5. **Problemi Comuni e Soluzioni**

#### Problema: NaN nei costi
```typescript
// ❌ SBAGLIATO
const cost = parseFloat('');  // NaN

// ✅ CORRETTO
const cost = safeParseFloat('');  // 0
```

#### Problema: Array vuoti
```typescript
// ❌ SBAGLIATO
parts: [],
documents: [],

// ✅ CORRETTO
// Non includere il campo se l'array è vuoto
if (parts.length > 0) {
  maintenanceData.parts = parts;
}
```

#### Problema: Timestamp non valido
```typescript
// ❌ SBAGLIATO
date: new Date(),  // JavaScript Date

// ✅ CORRETTO
date: Timestamp.fromDate(new Date()),  // Firebase Timestamp
```

### 6. **Come Leggere l'Errore Firestore**

Nell'errore vedrai:

```
=== FIRESTORE ERROR ===
Error code: ...
Error message: ...
Error details: { ... }
=== END ERROR ===
```

**Codici comuni:**
- `permission-denied`: Problema di regole Firestore (deploya le regole!)
- `invalid-argument`: Dati non validi (NaN, undefined, tipo sbagliato)
- `failed-precondition`: Regola di validazione fallita

### 7. **Procedura di Debug Completa**

1. ✅ Apri console del browser (F12)
2. ✅ Vai su "Nuova Manutenzione"
3. ✅ Compila SOLO i campi obbligatori:
   - Tipo: "Tagliando"
   - Descrizione: "Test manutenzione"
   - Chilometraggio: "50000"
4. ✅ Clicca "Salva Manutenzione"
5. ✅ Guarda i log nella console
6. ✅ Cerca errori nei log (vedi sezione 2)
7. ✅ Copia i log e mandali qui

### 8. **Checklist Verifica**

Verifica questi punti:

- [ ] Hai deployato le regole Firestore? (vedi FIREBASE_RULES_DEPLOY.md)
- [ ] L'utente è autenticato? (console mostra user.uid)
- [ ] Il vehicleId esiste? (console mostra vehicleId)
- [ ] Tutti i campi numerici sono numeri validi? (non NaN)
- [ ] Il campo `date` è un Timestamp Firebase?
- [ ] Il campo `type` è uno dei valori validi?
- [ ] Non ci sono array vuoti?
- [ ] Non ci sono stringhe vuote?

### 9. **File da Controllare**

Se l'errore persiste, controlla questi file:

1. **src/screens/user/AddMaintenanceScreen.tsx** (linea ~240)
   - Log dei form values
   - Log dei data types

2. **src/services/MaintenanceService.ts** (linea ~115)
   - Log del record originale
   - Log del record pulito
   - Log di ogni singolo campo

3. **Console del browser**
   - Tab "Console" per i log
   - Tab "Network" per vedere la richiesta HTTP fallita
   - Cerca la richiesta a `firestore.googleapis.com`
   - Guarda il payload nella tab "Payload" o "Request"

### 10. **Invia questi Dati**

Se l'errore persiste, mandami:

1. **Log completo** da `=== ADDMAINTENANCE DEBUG ===` a `=== END ERROR ===`
2. **Screenshot** della console con l'errore
3. **Valori** che hai inserito nel form

## 🔧 Fix Temporaneo

Se vuoi testare senza l'errore, prova a commentare i campi opzionali in AddMaintenanceScreen.tsx:

```typescript
// Commenta tutto tranne i campi base
const maintenanceData: any = {
  vehicleId: vehicleId!,
  ownerId: user.uid,
  type: type,
  description: description.trim(),
  date: Timestamp.fromDate(date),
  mileage: safeParseInt(mileage),
  cost: 0,  // Zero invece di calcolo
  warranty: false,  // Sempre false
  isVisible: true,
};

// NON aggiungere nient'altro
```

Salva e prova. Se funziona, il problema è in un campo opzionale.

## 📞 Supporto

Manda i log completi e ti aiuterò a identificare il problema esatto!
