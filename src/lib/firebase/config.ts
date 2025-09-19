import { getApps, initializeApp } from "firebase/app";
import {
    getAuth,
    setPersistence,
    inMemoryPersistence,
    browserLocalPersistence,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBe2bVNVioL9IZZuoPAJICfrV1cCABCbZs",
    authDomain: "agetnact.firebaseapp.com", //http://agetnact.firebaseapp.com/
    projectId: "agetnact",
    storageBucket: "agetnact.firebasestorage.app",
    messagingSenderId: "16179356269",
    appId: "1:16179356269:web:dc55222066884930ddd564",
    measurementId: "G-HXBJJ0PM1F",
};

const firebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(firebaseApp);

// Configure persistence to avoid IndexedDB issues in Electron
const configurePersistence = async () => {
    try {
        // Fallback to browser local persistence
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase Auth: Using browser local persistence");
    } catch (error) {
        console.warn("Failed to set in-memory persistence:", error);
        try {
            // Try to use in-memory persistence first (avoids IndexedDB issues)
            await setPersistence(auth, inMemoryPersistence);
            console.log("Firebase Auth: Using in-memory persistence");
        } catch (fallbackError) {
            console.error("Failed to set any persistence:", fallbackError);
            // Continue with default persistence
        }
    }
};

// Initialize persistence
configurePersistence();

export const firebaseAuth = auth;
