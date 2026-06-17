import config from '../config';
import { prisma } from '../config/database';

interface ExtractionResult {
  fields: ExtractionFieldData[];
  confidence: number;
  rawResponse: string;
}

interface ExtractionFieldData {
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  confidence: number;
  section: string;
}

async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch(`${config.claudeBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.claudeApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function callGroq(prompt: string, imageBase64?: string): Promise<string> {
  const messages: any[] = [];
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const response = await fetch(config.groqBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: imageBase64 ? 'llama-3.2-90b-vision-preview' : 'llama-3.1-8b-instant',
      messages,
      max_tokens: 4096,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} ${err}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function cleanJsonResponse(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return jsonMatch ? jsonMatch[1].trim() : text.trim();
}

function getSchemaForCategory(category: string): string {
  const schemas: Record<string, string> = {
    BILAN: `{
  "actif_immobilise": { "brut": number, "amortissements": number, "net": number },
  "actif_circulant": { "brut": number, "amortissements": number, "net": number },
  "tresorerie_actif": { "brut": number, "net": number },
  "capitaux_propres": { "montant": number },
  "dettes_financement": { "montant": number },
  "passif_circulant": { "montant": number },
  "tresorerie_passif": { "montant": number },
  "total_actif": number,
  "total_passif": number
}`,
    CPC: `{
  "produits_exploitation": { "montant": number },
  "achats_consommes": { "montant": number },
  "charges_exploitation": { "montant": number },
  "resultat_exploitation": number,
  "produits_financiers": { "montant": number },
  "charges_financieres": { "montant": number },
  "resultat_financier": number,
  "resultat_courant": number,
  "produits_non_courants": { "montant": number },
  "charges_non_courantes": { "montant": number },
  "resultat_non_courant": number,
  "impot_societes": { "montant": number },
  "resultat_net": number
}`,
    BALANCE: `{
  "comptes": [
    { "numero": string, "intitule": string, "debit": number, "credit": number, "solde_debiteur": number, "solde_crediteur": number }
  ],
  "total_debit": number,
  "total_credit": number
}`,
    ESG: `{
  "production_exercice": { "montant": number },
  "valeur_ajoutee": { "montant": number },
  "excédent_brut_exploitation": { "montant": number },
  "resultat_exploitation": { "montant": number },
  "resultat_courant": { "montant": number },
  "resultat_net": { "montant": number }
}`,
    TABLEAU_FINANCEMENT: `{
  "emplois_stables": { "montant": number },
  "ressources_stables": { "montant": number },
  "variation_fdr": number,
  "besoins_fr": { "montant": number },
  "tresorerie_nette": { "montant": number }
}`,
    ETIC: `{
  "etat_dettes": { "montant": number },
  "etat_creances": { "montant": number },
  "garanties": string,
  "engagements_hors_bilan": string
}`,
    PIECE_JUSTIFICATIVE: `{
  "document_type": string,
  "emetteur": string,
  "date": string,
  "numero": string,
  "montant_ttc": number,
  "montant_ht": number,
  "tva": number,
  "description": string,
  "lignes": [{ "description": string, "quantite": number, "prix_unitaire": number, "montant": number }]
}`,
  };
  return schemas[category] || schemas.PIECE_JUSTIFICATIVE;
}

const SYSTEM_PROMPT = `Tu es un expert-comptable spécialisé dans le Plan Comptable Marocain (CGNC). 
Extrais les données financières du document fourni et retourne-les UNIQUEMENT au format JSON.
Respecte strictement le schéma demandé. N'ajoute aucun texte hors du JSON.
Si une valeur est illisible ou absente, mets null.
Arrondis les montants à 2 décimales.`;

function buildExtractionPrompt(category: string, text: string): string {
  const schema = getSchemaForCategory(category);
  return `Extrais les données de ce document financier de catégorie "${category}" au format JSON suivant :
${schema}

Document :
${text}

Retourne UNIQUEMENT le JSON valide.`;
}

export async function extractDocument(
  text: string,
  category: string,
  imageBase64?: string,
): Promise<ExtractionResult> {
  const prompt = buildExtractionPrompt(category, text);
  let rawResponse: string;

  if (config.claudeApiKey) {
    rawResponse = await callClaude(prompt, SYSTEM_PROMPT);
  } else if (config.groqApiKey) {
    rawResponse = await callGroq(prompt, imageBase64);
  } else {
    throw new Error('Aucune clé API IA configurée (Claude ou Groq)');
  }

  const cleaned = cleanJsonResponse(rawResponse);
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('La réponse IA n\'est pas un JSON valide');
  }

  const fields: ExtractionFieldData[] = [];
  let overallConfidence = 0.85;
  let fieldCount = 0;

  function flatten(obj: Record<string, any>, section: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        flatten(value, key);
      } else if (Array.isArray(value)) {
        fields.push({
          fieldName: key,
          fieldValue: JSON.stringify(value),
          fieldType: 'array',
          confidence: 0.8,
          section,
        });
        fieldCount++;
      } else {
        const confidence = value === null ? 0 : 0.85;
        fields.push({
          fieldName: key,
          fieldValue: String(value),
          fieldType: typeof value === 'number' ? 'number' : 'text',
          confidence,
          section,
        });
        overallConfidence += confidence;
        fieldCount++;
      }
    }
  }

  flatten(parsed);
  overallConfidence = fieldCount > 0 ? overallConfidence / fieldCount : 0.85;

  return { fields, confidence: Math.round(overallConfidence * 100) / 100, rawResponse };
}

export async function createExtractionRecord(
  documentId: string,
  result: ExtractionResult,
): Promise<void> {
  const extraction = await prisma.extraction.create({
    data: {
      documentId,
      status: 'COMPLETED',
      confidence: result.confidence,
      modelUsed: config.claudeApiKey ? 'claude-sonnet-4' : 'llama-3.2-90b-vision-preview',
      fields: {
        create: result.fields.map(f => ({
          fieldName: f.fieldName,
          fieldValue: f.fieldValue,
          fieldType: f.fieldType,
          confidence: f.confidence,
          section: f.section,
        })),
      },
    },
  });

  await prisma.document.update({
    where: { id: documentId },
    data: { status: 'AWAITING_REVIEW' },
  });
}
