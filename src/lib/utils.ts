import { db, initializeDB } from "@/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { firebaseAuth } from "./firebase/config";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function logoutCleanUp() {
    console.log("COMING HERE")
    // Clear local storage
    localStorage.clear();

    // Clear firebase auth state
    firebaseAuth.signOut();
    firebaseAuth.currentUser?.delete();
    firebaseAuth.updateCurrentUser(null);

    // Clear Cookies
    document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // clear IndexedDB if needed
    await db.delete();
    initializeDB();
}
