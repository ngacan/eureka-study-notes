import { firebaseConfig } from '../firebaseConfig';

let auth: any = null;
let firestore: any = null;
let initialized = false;

// --- INITIALIZATION ---
export const initializeFirebase = (): boolean => {
  if (initialized) return true;

  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && (window as any).firebase) {
    try {
      (window as any).firebase.initializeApp(firebaseConfig);
      auth = (window as any).firebase.auth();
      firestore = (window as any).firebase.firestore();
      initialized = true;
      return true;
    } catch (e) {
      console.error("Firebase initialization error:", e);
      return false;
    }
  }
  return false;
};

// --- HELPERS ---
const getAuth = () => {
  if (!auth)
    throw new Error("Firebase Auth has not been initialized. Make sure to call initializeFirebase() first.");
  return auth;
};

const getFirestore = () => {
  if (!firestore)
    throw new Error("Firebase Firestore has not been initialized. Make sure to call initializeFirebase() first.");
  return firestore;
};

// --- AUTHENTICATION ---
export const signInWithGoogleCredential = async (idToken: string) => {
  const auth = getAuth();
  const credential = (window as any).firebase.auth.GoogleAuthProvider.credential(idToken);
  return auth.signInWithCredential(credential);
};

export const signOutUser = () => getAuth().signOut();

export const onAuthStateChangedListener = (callback: (user: any) => void) => {
  return getAuth().onAuthStateChanged(callback);
};

// --- FIRESTORE NOTES ---
const notesCollection = () => getFirestore().collection('notes');

export const addNote = async (noteData: any) => {
  return await notesCollection().add(noteData);
};

export const updateNote = async (noteId: string, noteData: any) => {
  return await notesCollection().doc(noteId).update(noteData);
};

export const deleteNote = async (noteId: string) => {
  return await notesCollection().doc(noteId).delete();
};

export const onNotesSnapshot = (
  userId: string,
  callback: (notes: any[]) => void
) => {
  return notesCollection()
    .where('userId', '==', userId)
    .onSnapshot((snapshot: any) => {
      const notes = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      notes.sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      callback(notes);
    });
};
