// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALb-skLvuA13-PjFGYoEn72VRqOgKiwxM",
  authDomain: "crash-db-1ff97.firebaseapp.com",
  databaseURL: "https://crash-db-1ff97-default-rtdb.firebaseio.com",
  projectId: "crash-db-1ff97",
  storageBucket: "crash-db-1ff97.firebasestorage.app",
  messagingSenderId: "835131009195",
  appId: "1:835131009195:web:d6ede55751353f04ec6fee",
  measurementId: "G-8YZDD3F6SV"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
