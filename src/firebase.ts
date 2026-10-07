import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot (Mandatory per firebase-integration-rpc skill)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Auth helpers
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  return fbSignOut(auth);
}

function sanitizeId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

export interface StoredChatSession {
  id: string;
  title: string;
  ownerId: string;
  messageCount: number;
  lastMessagePreview: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredChatMessage {
  id: string;
  sessionId: string;
  ownerId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  expertsUsed: string;
  reasoning: string;
  expertOutputsJson: string;
  elapsedSeconds: number;
  createdAt?: Timestamp;
}

export interface StoredRagDocument {
  id: string;
  fileName: string;
  ownerId: string;
  content: string;
  chunksCount: number;
  fileType: string;
  createdAt?: Timestamp;
}

export interface StoredWatchHistoryItem {
  id: string;
  videoId: string;
  ownerId: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  uploader: string;
  duration: number;
  progressSeconds: number;
  quality: string;
  detectedLanguage: string;
  srtArabic: string;
  srtOriginal: string;
  deviceName: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredCloudInfrastructure {
  id: string;
  ownerId: string;
  instanceShape: string;
  instanceRegion: string;
  publicIp: string;
  vpnClientConf: string;
  vpnServerConf: string;
  sshPublicKey: string;
  groqEnabled: boolean;
  status: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function saveWatchHistoryToDb(params: {
  videoId: string;
  title: string;
  videoUrl: string;
  thumbnail?: string;
  uploader?: string;
  duration: number;
  progressSeconds: number;
  quality?: string;
  detectedLanguage?: string;
  srtArabic?: string;
  srtOriginal?: string;
  deviceName?: string;
  isUpdate?: boolean;
}) {
  const user = auth.currentUser;
  if (!user) return;
  const vid = sanitizeId(params.videoId);
  const watchDocId = sanitizeId(`${user.uid.slice(0, 16)}_${vid}`);
  const path = `watch_history/${watchDocId}`;
  try {
    const payload = {
      videoId: vid,
      ownerId: user.uid,
      title: (params.title || 'فيديو').slice(0, 300),
      videoUrl: (
        params.videoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
      ).slice(0, 1000),
      thumbnail: (params.thumbnail || '').slice(0, 1000),
      uploader: (params.uploader || 'Hybrid Media').slice(0, 200),
      duration: Math.max(0, Math.min(86400, Number(params.duration || 60))),
      progressSeconds: Math.max(0, Math.min(86400, Number(params.progressSeconds || 0))),
      quality: (params.quality || '720').slice(0, 20),
      detectedLanguage: (params.detectedLanguage || 'en').slice(0, 20),
      srtArabic: (params.srtArabic || '').slice(0, 30000),
      srtOriginal: (params.srtOriginal || '').slice(0, 30000),
      deviceName: (params.deviceName || 'Web Browser · Hybrid AI').slice(0, 100),
      updatedAt: serverTimestamp(),
    };

    if (params.isUpdate) {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'watch_history', watchDocId), {
        title: payload.title,
        videoUrl: payload.videoUrl,
        thumbnail: payload.thumbnail,
        uploader: payload.uploader,
        duration: payload.duration,
        progressSeconds: payload.progressSeconds,
        quality: payload.quality,
        detectedLanguage: payload.detectedLanguage,
        srtArabic: payload.srtArabic,
        srtOriginal: payload.srtOriginal,
        deviceName: payload.deviceName,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'watch_history', watchDocId), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, params.isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteWatchHistoryFromDb(watchDocId: string) {
  const user = auth.currentUser;
  if (!user) return;
  const wid = sanitizeId(watchDocId);
  const path = `watch_history/${wid}`;
  try {
    await deleteDoc(doc(db, 'watch_history', wid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCloudInfrastructureToDb(params: {
  instanceShape: string;
  instanceRegion: string;
  publicIp: string;
  vpnClientConf: string;
  vpnServerConf: string;
  sshPublicKey: string;
  groqEnabled: boolean;
  status: string;
  isUpdate?: boolean;
}) {
  const user = auth.currentUser;
  if (!user) return;
  const infraId = sanitizeId(user.uid);
  const path = `cloud_infrastructure/${infraId}`;
  try {
    const payload = {
      ownerId: user.uid,
      instanceShape: (params.instanceShape || 'VM.Standard.A1.Flex').slice(0, 100),
      instanceRegion: (params.instanceRegion || 'eu-frankfurt-1').slice(0, 100),
      publicIp: (params.publicIp || '129.151.142.88').slice(0, 100),
      vpnClientConf: (params.vpnClientConf || '[Interface]').slice(0, 4000),
      vpnServerConf: (params.vpnServerConf || '[Interface]').slice(0, 4000),
      sshPublicKey: (params.sshPublicKey || 'ssh-ed25519').slice(0, 2000),
      groqEnabled: Boolean(params.groqEnabled),
      status: (params.status || 'ACTIVE').slice(0, 50),
      updatedAt: serverTimestamp(),
    };

    if (params.isUpdate) {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'cloud_infrastructure', infraId), {
        instanceShape: payload.instanceShape,
        instanceRegion: payload.instanceRegion,
        publicIp: payload.publicIp,
        vpnClientConf: payload.vpnClientConf,
        vpnServerConf: payload.vpnServerConf,
        sshPublicKey: payload.sshPublicKey,
        groqEnabled: payload.groqEnabled,
        status: payload.status,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'cloud_infrastructure', infraId), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, params.isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function createOrUpdateSessionInDb(params: {
  sessionId: string;
  title: string;
  messageCount: number;
  lastMessagePreview: string;
  isNew: boolean;
}) {
  const user = auth.currentUser;
  if (!user) return;
  const sid = sanitizeId(params.sessionId);
  const path = `sessions/${sid}`;
  try {
    if (params.isNew) {
      await setDoc(doc(db, 'sessions', sid), {
        title: params.title.slice(0, 200) || 'محادثة جديدة',
        ownerId: user.uid,
        messageCount: Math.max(0, Math.min(10000, Math.floor(params.messageCount))),
        lastMessagePreview: (params.lastMessagePreview || '').slice(0, 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'sessions', sid), {
        title: params.title.slice(0, 200) || 'محادثة جديدة',
        messageCount: Math.max(0, Math.min(10000, Math.floor(params.messageCount))),
        lastMessagePreview: (params.lastMessagePreview || '').slice(0, 500),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, params.isNew ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function saveMessageToDb(params: {
  messageId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  expertsUsed?: string[];
  reasoning?: string;
  expertOutputs?: Record<string, string>;
  elapsedSeconds?: number;
}) {
  const user = auth.currentUser;
  if (!user) return;
  const mid = sanitizeId(params.messageId);
  const sid = sanitizeId(params.sessionId);
  const path = `messages/${mid}`;
  try {
    await setDoc(doc(db, 'messages', mid), {
      sessionId: sid,
      ownerId: user.uid,
      role: params.role,
      content: (params.content || '...').slice(0, 20000),
      expertsUsed: (params.expertsUsed || []).join(',').slice(0, 200),
      reasoning: (params.reasoning || '').slice(0, 2000),
      expertOutputsJson: JSON.stringify(params.expertOutputs || {}).slice(0, 30000),
      elapsedSeconds: Number(params.elapsedSeconds || 0),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveRagDocumentToDb(params: {
  docId: string;
  fileName: string;
  content: string;
  chunksCount: number;
  fileType: string;
}) {
  const user = auth.currentUser;
  if (!user) return;
  const did = sanitizeId(params.docId);
  const path = `rag_documents/${did}`;
  try {
    await setDoc(doc(db, 'rag_documents', did), {
      fileName: (params.fileName || 'document.txt').slice(0, 255),
      ownerId: user.uid,
      content: (params.content || '...').slice(0, 50000),
      chunksCount: Math.max(0, Math.min(5000, Math.floor(params.chunksCount))),
      fileType: (params.fileType || '.txt').slice(0, 20),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSessionFromDb(sessionId: string) {
  const user = auth.currentUser;
  if (!user) return;
  const sid = sanitizeId(sessionId);
  const path = `sessions/${sid}`;
  try {
    await deleteDoc(doc(db, 'sessions', sid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp };
