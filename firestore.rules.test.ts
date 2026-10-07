/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 */
export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  { id: 1, name: 'Unauthenticated Write', collection: 'sessions', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified Email Spoof', collection: 'sessions', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'ID Poisoning Attack', collection: 'sessions', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Identity Spoofing on Create', collection: 'sessions', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow Field Injection', collection: 'sessions', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Orphaned Message Creation', collection: 'messages', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Cross-Tenant Session Hijack', collection: 'messages', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Value Poisoning on Update', collection: 'sessions', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Immutable Field Mutation', collection: 'sessions', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Forged Timestamp Attack', collection: 'sessions', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Unauthorized List Scraping', collection: 'sessions', operation: 'list', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'RAG Document Oversized Payload', collection: 'rag_documents', operation: 'create', expected: 'PERMISSION_DENIED' },
];
