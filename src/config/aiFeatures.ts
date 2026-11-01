// src/config/aiFeatures.ts - Punti dell'app in cui arriverà l'AI, con il testo del popup informativo

export interface AiFeature {
  label: string;
  title: string;
  description: string;
}

const defineFeatures = <K extends string>(features: Record<K, AiFeature>) => features;

export const AI_FEATURES = defineFeatures({
  supplierDocument: {
    label: 'Carica da bolla con AI',
    title: 'Carico da bolla o fattura',
    description: 'Fotografi la bolla o la fattura del fornitore e l\'AI prepara le righe di carico con quantità e costi. Le controlli e le confermi prima che entrino in magazzino.',
  },
  plannedParts: {
    label: 'Proponi pezzi con AI',
    title: 'Pezzi previsti',
    description: 'Dalla descrizione del lavoro e dall\'auto, l\'AI propone i pezzi probabili così puoi comprarli in anticipo. Sei tu a scegliere quali aggiungere.',
  },
  workSummary: {
    label: 'Riassumi con AI',
    title: 'Riassunto del lavoro',
    description: 'L\'AI trasforma i tuoi appunti in un testo chiaro per il cliente e per lo storico dell\'auto. Puoi modificarlo prima di salvare.',
  },
  mechanicProblem: {
    label: 'Ordina il problema con AI',
    title: 'Descrivi il problema',
    description: 'Scrivi quello che riferisce il cliente e l\'AI lo ordina in una descrizione chiara, con i controlli da fare in officina. Non è una diagnosi: la valutazione resta tua.',
  },
  ownerProblem: {
    label: 'Aiutami a descriverlo',
    title: 'Descrivi il problema',
    description: 'L\'AI ti aiuta a scrivere una richiesta chiara per l\'officina, partendo dalle tue parole. Non è una diagnosi e non indica costi.',
  },
  deadlineDocument: {
    label: 'Leggi da un documento con AI',
    title: 'Scadenze dai documenti',
    description: 'Fotografi polizza o revisione e l\'AI ricava tipo di scadenza e data. Le controlli prima di salvare. La foto viene inviata a un servizio AI esterno.',
  },
  vehicleRegistration: {
    label: 'Compila dal libretto con AI',
    title: 'Veicolo dal libretto',
    description: 'Fotografi il libretto e l\'AI compila marca, modello, targa e gli altri dati tecnici. Li controlli prima di salvare. La foto viene inviata a un servizio AI esterno.',
  },
  receipt: {
    label: 'Leggi lo scontrino con AI',
    title: 'Scontrini',
    description: 'Fotografi lo scontrino e l\'AI ricava importo, data e, per il carburante, i litri. Li controlli prima di salvare. La foto viene inviata a un servizio AI esterno.',
  },
});

export type AiFeatureKey = keyof typeof AI_FEATURES;
