# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Global Deny By Default**: Any path not explicitly matched is denied (`allow read, write: if false;`).
2. **Authentication & Verified Email**: All reads and writes require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Path ID Hardening**: All single-document operations (`get`, `create`, `update`, `delete`) validate document IDs using `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Ownership Integrity (`ownerId`)**: Every document in `sessions`, `messages`, `rag_documents`, and `user_settings` must have `ownerId == request.auth.uid`. For `user_settings/{userId}`, `userId == request.auth.uid` as well.
5. **Relational Integrity**: Creating a `ChatMessage` in `/messages/{messageId}` requires that `/sessions/$(incoming().sessionId)` exists and belongs to `request.auth.uid`.
6. **Temporal Integrity**: `createdAt` must equal `request.time` on creation and remain immutable on update. `updatedAt` must equal `request.time` on creation and update.
7. **Strict Schema & Size Enforcement**: All string fields have explicit `.size()` bounds matching `firebase-blueprint.json`. No shadow/ghost fields are allowed (`keys().hasAll(...)` and `keys().hasOnly(...)`).

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Creating a session with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Creating a session with `email_verified == false` -> `PERMISSION_DENIED`.
3. **ID Poisoning Attack**: Creating `/sessions/invalid$id!@#` -> `PERMISSION_DENIED`.
4. **Identity Spoofing on Create**: Creating a session where `ownerId != request.auth.uid` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection**: Creating a session with an extra `isAdmin: true` field -> `PERMISSION_DENIED`.
6. **Orphaned Message Creation**: Creating a message referencing a non-existent `sessionId` -> `PERMISSION_DENIED`.
7. **Cross-Tenant Session Hijack**: Creating a message referencing a `sessionId` owned by another user -> `PERMISSION_DENIED`.
8. **Value Poisoning on Update**: Updating `session.title` with a boolean or 500-char string -> `PERMISSION_DENIED`.
9. **Immutable Field Mutation**: Updating `createdAt` or `ownerId` on an existing session -> `PERMISSION_DENIED`.
10. **Forged Timestamp Attack**: Creating a document with a past/future `createdAt != request.time` -> `PERMISSION_DENIED`.
11. **Unauthorized List Scraping**: Listing `/sessions` without filtering by `resource.data.ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
12. **RAG Document Oversized Payload**: Creating a `/rag_documents/{docId}` with `content.size() > 50000` -> `PERMISSION_DENIED`.
