import { db, auth } from "@/src/firebase.ts";
import { addDoc, collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const createTask = async (args: { title: string; deadline?: string }) => {
  const path = "tasks";
  try {
    const docRef = await addDoc(collection(db, path), {
      title: args.title,
      deadline: args.deadline || null,
      completed: false,
      createdAt: Timestamp.now(),
    });

    return { 
      status: "Task stored", 
      id: docRef.id,
      task: {
        id: docRef.id,
        title: args.title,
        deadline: args.deadline,
        completed: false,
        createdAt: Date.now()
      }
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error; // Should not reach here due to handleFirestoreError throwing
  }
};

export const getTasks = async () => {
  const path = "tasks";
  try {
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};
