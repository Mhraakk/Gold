const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

const newInterfaces = `
export type SourceState = 
  | 'candidate'
  | 'testing'
  | 'verified_live'
  | 'delayed'
  | 'stale'
  | 'unavailable'
  | 'rejected'
  | 'archived';

export interface WhatsAppSourceAdapter {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: 'whatsapp_channel';
  rawMessageText: string;
  messageTimestamp: number | null;
  fetchedAt: number;
  parsedAsset: string | null;
  parsedPrice: number | null;
  explicitUnit: string | null;
  normalizedIrrValue: number | null;
  validationStatus: string;
  freshnessStatus: string;
  confidenceScore: number;
  parserVersion: string;
  sourceHealth: string;
  status: SourceState;
  priority: 'high' | 'medium' | 'low';
}
`;

content += newInterfaces;
fs.writeFileSync('src/types.ts', content);
