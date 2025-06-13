
import { initializeApp } from "firebase/app";
import getAnalytics from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { collection, getFirestore } from "firebase/firestore";


//web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDaV2XQV6GjBiul_IX0L5LuIQaGhQefQ64",
  authDomain: "conline-1f985.firebaseapp.com",
  projectId: "conline-1f985",
  storageBucket: "conline-1f985.firebasestorage.app",
  messagingSenderId: "551835191424",
  appId: "1:551835191424:web:9a0b5cb393847bbd53fe65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firebaseDB = getFirestore(app);

export const usersRef = collection(firebaseDB, "users");
export const meetingsRef = collection(firebaseDB, "meetings");