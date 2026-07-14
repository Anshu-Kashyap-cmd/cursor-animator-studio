import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, deleteDoc, orderBy, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxPqeIzMfeWILtBZgR5tjxEKdHExKJZ1I",
  authDomain: "disco-venture-17c1c.firebaseapp.com",
  projectId: "disco-venture-17c1c",
  storageBucket: "disco-venture-17c1c.firebasestorage.app",
  messagingSenderId: "142603194325",
  appId: "1:142603194325:web:90915c8b26be8129f4f75c"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (utilizing custom database ID from configuration)
export const db = getFirestore(app, "ai-studio-a0b63ec4-740b-4257-a2e0-7b426bd4d7bb");

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Triggers Google Sign-In Popup via Firebase
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create/update user document in Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      id: user.uid,
      email: user.email,
      display_name: user.displayName,
      updated_at: new Date().toISOString()
    }, { merge: true });

    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

/**
 * Signs the current user out
 */
export async function signOut() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}
