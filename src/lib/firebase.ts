// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-4521762127-194ad",
  "appId": "1:808971180361:web:2f9eb19a01f5b9b5be2298",
  "storageBucket": "studio-4521762127-194ad.firebasestorage.app",
  "apiKey": "AIzaSyDH9-THIw0LDtCo7686b41YMP8cOjhUlqM",
  "authDomain": "studio-4521762127-194ad.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "808971180361",
  "databaseURL": "https://studio-4521762127-194ad-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
