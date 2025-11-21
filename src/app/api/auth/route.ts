import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, ref, get, update, remove } from "firebase/database";
import { NextResponse } from 'next/server';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const passwordsRef = ref(database, 'passwords');
    const snapshot = await get(passwordsRef);

    if (snapshot.exists()) {
      const passwordsData = snapshot.val();
      let found = false;
      let validity = '1h';
      let passwordKey = '';
      let storedPasswordData: any = null;

      for (const key in passwordsData) {
        const storedPassword = passwordsData[key];
        if (storedPassword.password === password) {
          found = true;
          validity = storedPassword.validity || '1h';
          passwordKey = key;
          storedPasswordData = storedPassword;
          break;
        }
      }

      if (found && storedPasswordData) {
        const passwordRef = ref(database, `passwords/${passwordKey}`);

        if (storedPasswordData.uses && storedPasswordData.uses > 1) {
          await update(passwordRef, { uses: storedPasswordData.uses - 1 });
        } else {
          await remove(passwordRef);
        }

        return NextResponse.json({ success: true, validity: validity }, { status: 200 });

      } else {
        return NextResponse.json({ error: "ACCESS DENIED: Incorrect password" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "ACCESS DENIED: No passwords found in database" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "SYSTEM ERROR: An internal server error occurred." }, { status: 500 });
  }
}
