import config from '../config';

const GROQ_API_URL = config.groqBaseUrl;

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | { type: string; text?: string; image_url?: { url: string } }[];
}

interface GroqResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

async function callGroq(messages: GroqMessage[], model: string = 'llama-3.2-90b-vision-preview'): Promise<string | null> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = (await response.json()) as GroqResponse;
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    return null;
  } catch (err) {
    console.error('Groq API call failed:', err);
    return null;
  }
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  return cleaned;
}

export async function extractDocument(base64Image: string): Promise<any | null> {
  const extractionPrompt = `Vous êtes un expert-comptable marocain. Analysez ce document financier.
Il peut s'agir d'une facture, d'un reçu ou d'un relevé bancaire.
Extrayez les informations suivantes et retournez UNIQUEMENT un objet JSON valide,
sans texte supplémentaire, sans balises Markdown, sans commentaires.

{
  "documentType": "invoice" | "receipt" | "bank_statement",
  "vendorName": "...",
  "documentNumber": "...",
  "date": "AAAA-MM-JJ",
  "dueDate": "AAAA-MM-JJ ou null",
  "totalAmount": <nombre décimal>,
  "currency": "MAD" | "USD" | "EUR",
  "taxAmount": <nombre décimal>,
  "taxRate": <pourcentage en nombre entier, ex: 20>,
  "lineItems": [...],
  "category": "...",
  "notes": "...",
  "riskFlags": [...]
}`;

  const messages: GroqMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: extractionPrompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
      ],
    },
  ];

  const content = await callGroq(messages);
  if (!content) return null;

  try {
    const cleaned = cleanJsonResponse(content);
    return JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse Groq response as JSON:', content.substring(0, 200));
    return null;
  }
}

export async function suggestPcmAccount(
  description: string,
  vendorName: string,
  amount: number,
  documentType: string,
  category?: string
): Promise<{ accountNumber: string; accountName: string; confidence: number } | null> {
  const prompt = `Vous êtes un expert-comptable marocain spécialiste du Plan Comptable Marocain (PCM).
Analysez cette transaction et suggérez le compte PCM le plus approprié.

Transaction:
- Description: "${description}"
- Fournisseur/Client: "${vendorName}"
- Montant: ${amount} MAD
- Type: ${documentType}
- Catégorie: ${category || 'Non spécifiée'}

Retournez UNIQUEMENT un objet JSON valide, sans texte supplémentaire, sans balises Markdown:
{
  "accountNumber": "XXXXX",
  "accountName": "Nom du compte PCM",
  "confidence": 0.95
}

La confiance doit être un nombre entre 0 et 1.
Utilisez les comptes PCM marocains standards (Classe 1 à 8).
Réfléchissez au type d'opération pour choisir le bon compte:
- Facture fournisseur (achat) → Comptes de la classe 3, 6
- Reçu (espèces) → 5161 Caisse, comptes classe 6
- Relevé bancaire → 5111 Banque, comptes classe 6 ou 7
- Revenus → 7111 Ventes, 7121 Prestations
- Charges → 6111 Achats, 6131 Locations, 6141 Transport, etc.
- TVA → 4454 TVA récupérable, 4455 TVA due`;

  const messages: GroqMessage[] = [
    { role: 'user', content: prompt },
  ];

  const content = await callGroq(messages, 'llama-3.1-8b-instant');
  if (!content) return null;

  try {
    const cleaned = cleanJsonResponse(content);
    return JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse PCM suggestion:', content.substring(0, 200));
    return null;
  }
}
