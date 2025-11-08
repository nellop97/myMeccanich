# Template EmailJS per MyMeccanich

Questa cartella contiene i template HTML per le email inviate tramite EmailJS nel sistema di trasferimento veicoli.

## 📧 Template Disponibili

### 1. `template_transfer.html`
**Nome Template su EmailJS**: `template_transfer`

**Quando viene inviato**: Quando un proprietario crea una richiesta di trasferimento veicolo

**Destinatario**: Compratore (nuovo proprietario)

**Parametri EmailJS necessari**:
```javascript
{
  to_email: "email@compratore.com",      // Email destinatario
  to_name: "Mario Rossi",                 // Nome destinatario
  transfer_id: "abc123xyz",               // ID del trasferimento
  transfer_link: "https://...",           // Link per accettare
  expiry_date: "15 dicembre 2024"        // Data scadenza (formato italiano)
}
```

---

### 2. `template_acceptance_seller.html`
**Nome Template su EmailJS**: `template_acceptance_seller`

**Quando viene inviato**: Quando il compratore accetta il trasferimento

**Destinatario**: Venditore (ex proprietario)

**Parametri EmailJS necessari**:
```javascript
{
  to_email: "email@venditore.com",        // Email ex proprietario
  buyer_email: "email@compratore.com"     // Email nuovo proprietario
}
```

---

### 3. `template_acceptance_buyer.html`
**Nome Template su EmailJS**: `template_acceptance_buyer`

**Quando viene inviato**: Quando il compratore accetta il trasferimento

**Destinatario**: Compratore (nuovo proprietario)

**Parametri EmailJS necessari**:
```javascript
{
  to_email: "email@compratore.com"        // Email nuovo proprietario
}
```

---

## 🚀 Come Configurare su EmailJS

### Passo 1: Accedi a EmailJS
1. Vai su [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)
2. Accedi con il tuo account (o creane uno)

### Passo 2: Crea i Template
Per ogni template:

1. Vai su **Email Templates** nel menu laterale
2. Clicca su **Create New Template**
3. Inserisci il **Template Name** (es: `template_transfer`)
4. Nel campo **Subject**, inserisci:
   - Per `template_transfer`: `🚗 Richiesta di Trasferimento Veicolo - MyMeccanich`
   - Per `template_acceptance_seller`: `✅ Trasferimento Veicolo Completato - MyMeccanich`
   - Per `template_acceptance_buyer`: `🎉 Benvenuto! Hai ricevuto un nuovo veicolo - MyMeccanich`

5. Seleziona **HTML** come formato
6. Copia e incolla il contenuto del file `.html` corrispondente
7. Clicca su **Save**

### Passo 3: Verifica il Service ID
Nel file `TransferService.ts` il Service ID è impostato a:
```typescript
'service_zcjt1ki'
```

Assicurati che questo corrisponda al tuo Service ID su EmailJS (lo trovi in **Email Services**).

### Passo 4: Testa i Template
1. Usa il pulsante **Test** su EmailJS per ogni template
2. Inserisci valori di esempio per i parametri
3. Invia un'email di test

---

## 🎨 Caratteristiche dei Template

### Design
- ✅ **Responsive**: Si adattano a mobile, tablet e desktop
- ✅ **Cross-client**: Compatibili con Gmail, Outlook, Apple Mail, ecc.
- ✅ **Brand Consistency**: Colori e stile coerenti con MyMeccanich
- ✅ **Modern UI**: Design pulito e professionale

### Accessibilità
- ✅ Font leggibili
- ✅ Contrasto colori adeguato
- ✅ Pulsanti con dimensioni touch-friendly
- ✅ Testo alternativo per le immagini

### Elementi Visivi
- 🎨 Gradient headers
- 📦 Box informativi colorati
- 🔘 Call-to-action buttons ben visibili
- ✨ Emoji per maggiore engagement

---

## 🔧 Personalizzazione

Se vuoi modificare i template:

1. **Colori del brand**:
   - Blu primario: `#3b82f6` → `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
   - Verde successo: `#10b981`
   - Viola benvenuto: `#8b5cf6`

2. **Link**:
   - Sostituisci `https://yourapp.com` con il tuo URL reale
   - Aggiorna i link Privacy Policy e Termini di Servizio

3. **Logo**:
   - Puoi aggiungere un'immagine del logo sostituendo il testo "MyMeccanich" nell'header

---

## ⚠️ Note Importanti

1. **Parametri EmailJS**: I nomi dei parametri (es: `{{to_email}}`, `{{to_name}}`) devono corrispondere esattamente a quelli inviati dal codice
2. **Testing**: Testa sempre le email prima di andare in produzione
3. **Spam Filter**: Evita parole spam-trigger e mantieni un buon rapporto testo/HTML
4. **Encoding**: I file sono già in UTF-8 per supportare caratteri italiani (à, è, ì, ecc.)

---

## 📝 Esempio di Utilizzo nel Codice

```typescript
// Invio email trasferimento
await emailjs.send(
  'service_zcjt1ki',
  'template_transfer',
  {
    to_email: 'mario.rossi@email.com',
    to_name: 'Mario Rossi',
    transfer_id: 'TRANS_12345',
    transfer_link: 'https://app.mymeccanich.com/accept-transfer/TRANS_12345',
    expiry_date: '15 dicembre 2024'
  }
);
```

---

## 🆘 Supporto

Se hai problemi con i template:
1. Verifica che tutti i parametri siano corretti
2. Controlla i log della console per errori EmailJS
3. Usa il test integrato di EmailJS per debug

---

**Creato per MyMeccanich** 🚗
*Sistema di gestione veicoli intelligente*
