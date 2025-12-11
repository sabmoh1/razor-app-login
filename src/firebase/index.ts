
'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import React, { createContext, useContext, ReactNode } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyALb-skLvuA13-PjFGYoEn72VRqOgKiwxM",
  authDomain: "crash-db-1ff97.firebaseapp.com",
  databaseURL: "https://crash-db-1ff97-default-rtdb.firebaseio.com",
  projectId: "crash-db-1ff97",
  storageBucket: "crash-db-1ff97.appspot.com",
  messagingSenderId: "835131009195",
  appId: "1:835131009195:web:d6ede55751353f04ec6fee",
  measurementId: "G-8YZDD3F6SV"
};

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

if (typeof window !== "undefined") {
    if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
}


interface FirebaseContextType {
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, auth: null, firestore: null });

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
    return (
        <FirebaseContext.Provider value={{ app: firebaseApp, auth, firestore }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useAuth = () => useContext(FirebaseContext).auth;
