'use server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, set, remove } from 'firebase/database';
import { NextResponse } from 'next/server';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ message: 'Password is required.' }, { status: 400 });
    }

    const passwordsRef = ref(database, 'passwords');
    const snapshot = await get(passwordsRef);

    if (snapshot.exists()) {
      const allPasswords = snapshot.val();
      let isValid = false;
      let validity = '1h';
      let passwordKey: string | null = null;
      let passwordData: any = null;

      for (const key in allPasswords) {
        if (allPasswords[key].password === password) {
          isValid = true;
          validity = allPasswords[key].validity || '1h';
          passwordKey = key;
          passwordData = allPasswords[key];
          break;
        }
      }

      if (isValid && passwordKey && passwordData) {
        const passwordRef = ref(database, `passwords/${passwordKey}`);

        if (passwordData.uses && passwordData.uses > 1) {
          // Decrement uses count
          await set(passwordRef, { ...passwordData, uses: passwordData.uses - 1 });
        } else {
          // Delete password if uses are 1 or not defined
          await remove(passwordRef);
        }

        return NextResponse.json({ message: 'Login successful', validity: validity }, { status: 200 });
      } else {
        return NextResponse.json({ message: 'ACCESS DENIED: Incorrect password' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ message: 'ACCESS DENIED: No passwords found in database' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('API-Error:', error);
    return NextResponse.json({ message: 'SYSTEM ERROR: Could not connect to the server.' }, { status: 500 });
  }
}
