# Firebase Storage CORS Configuration

Questo documento spiega come configurare CORS per Firebase Storage per permettere upload da localhost e domini di produzione.

## Problema

Quando si tenta di fare upload su Firebase Storage da localhost, si ottiene l'errore:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:8081' has been blocked by CORS policy
```

## Soluzione

### Metodo 1: Usa gsutil (Consigliato)

1. **Installa Google Cloud SDK**
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. **Autentica**
   ```bash
   gcloud auth login
   ```

3. **Trova il nome del bucket**
   ```bash
   # Lista tutti i bucket del progetto
   gsutil ls

   # Oppure verifica dalla Firebase Console:
   # https://console.firebase.google.com > Storage
   ```

   Il bucket dovrebbe essere: `mymecanich.firebasestorage.app`

4. **Applica regole CORS**

   Per sviluppo (permette tutti i domini):
   ```bash
   gsutil cors set cors.json gs://mymecanich.firebasestorage.app
   ```

   Per produzione (permette solo domini specifici):
   ```bash
   gsutil cors set cors-production.json gs://mymecanich.firebasestorage.app
   ```

5. **Verifica**
   ```bash
   gsutil cors get gs://mymecanich.firebasestorage.app
   ```

### Metodo 2: Usa Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Seleziona il progetto **mymecanich**
3. Vai su **Cloud Storage** → **Browser**
4. Trova il bucket `mymecanich.firebasestorage.app`
5. Clicca sulla scheda **Configuration**
6. Nella sezione **CORS**, clicca **Edit**
7. Incolla il contenuto di `cors.json` o `cors-production.json`

### Metodo 3: Usa Firebase Console

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto **mymecanich**
3. Vai su **Storage**
4. Clicca sul link **Cloud Storage** in alto (porta a Google Cloud Console)
5. Segui i passi del Metodo 2

## File di Configurazione

### cors.json (Sviluppo)
Permette tutti i domini - usa solo per sviluppo:
- `origin: ["*"]` - Permette tutte le origini
- Tutti i metodi HTTP necessari

### cors-production.json (Produzione)
Permette solo domini specifici - usa per produzione:
- localhost:8081 (Expo web)
- localhost:19006 (Expo DevTools)
- Domini Firebase Hosting
- Il tuo dominio custom

## Verifica

Dopo aver applicato le regole, verifica che funzionino:

1. Ricarica l'app
2. Prova a caricare una foto o documento
3. Controlla la console del browser per errori CORS

## Troubleshooting

### L'errore persiste dopo aver configurato CORS

1. **Svuota cache del browser**
   - Chrome: Ctrl+Shift+Delete → Clear cache
   - Firefox: Ctrl+Shift+Delete → Clear cache

2. **Riavvia il server di sviluppo**
   ```bash
   # Ferma Expo
   # Riavvia con cache pulita
   npm start -- --clear
   ```

3. **Verifica che le regole siano state applicate**
   ```bash
   gsutil cors get gs://mymecanich.firebasestorage.app
   ```

4. **Controlla il nome del bucket**
   Il bucket dovrebbe essere: `mymecanich.firebasestorage.app`

   Per trovare il nome esatto:
   ```bash
   # Lista tutti i bucket
   gsutil ls

   # Oppure controlla l'errore originale nell'URL:
   # https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o?...
   ```

### Errore "403 Forbidden"

Se dopo aver configurato CORS ottieni errore 403:
1. Verifica le Firebase Storage Rules in `storage.rules`
2. Assicurati che l'utente sia autenticato
3. Verifica che l'utente abbia i permessi necessari

## Note di Sicurezza

- **MAI** usare `"origin": ["*"]` in produzione
- Specifica sempre i domini esatti per produzione
- Monitora l'uso di Storage per evitare abusi
- Usa Firebase Storage Rules per ulteriore sicurezza

## Link Utili

- [Firebase Storage CORS](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- [Google Cloud CORS](https://cloud.google.com/storage/docs/configuring-cors)
- [gsutil cors command](https://cloud.google.com/storage/docs/gsutil/commands/cors)
