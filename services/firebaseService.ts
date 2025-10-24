import { firebaseConfig } from '../firebaseConfig';

let auth: any = null;
let firestore: any = null;
let initialized = false;

// This must be called once when the app starts.
export const initializeFirebase = (): boolean => {
    // Prevent re-initialization
    if (initialized) return true;

    // Check if Firebase script has loaded and is configured
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
    return false; // Not configured or script not loaded
};


// --- HELPERS ---
const getAuth = () => {
    if (!auth) throw new Error("Firebase Auth has not been initialized. Make sure to call initializeFirebase() first.");
    return auth;
}

const getFirestore = () => {
    if (!firestore) throw new Error("Firebase Firestore has not been initialized. Make sure to call initializeFirebase() first.");
    return firestore;
}


// --- AUTHENTICATION ---
// Handles sign-in using an ID token from Google Identity Services
export const signInWithGoogleCredential = async (idToken: string) => {
    const auth = getAuth();
    // Create a Google credential with the token
    const credential = (window as any).firebase.auth.GoogleAuthProvider.credential(idToken);
    
    // Sign in with the credential
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
}

export const updateNote = async (noteId: string, noteData: any) => {
    return await notesCollection().doc(noteId).update(noteData);
}

export const deleteNote = async (noteId: string) => {
    return await notesCollection().doc(noteId).delete();
}

export const onNotesSnapshot = (userId: string, callback: (notes: any[]) => void) => {
    // The .orderBy('updatedAt', 'desc') was removed from the query below.
    // This query previously required a composite index in Firestore.
    // To fix this without manual database configuration, sorting is now handled on the client-side.
    return notesCollection().where('userId', '==', userId)
                          .onSnapshot(snapshot => {
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort notes on the client-side to maintain descending order by update date.
        // This is efficient for the expected number of notes in this app.
        notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        callback(notes);
    });
}