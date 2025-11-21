import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
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

export async function GET() {
  try {
    const urlRef = ref(database, 'websocket_url');
    const snapshot = await get(urlRef);

    if (snapshot.exists()) {
      const url = snapshot.val();
      return NextResponse.json({ url }, { status: 200 });
    } else {
      return NextResponse.json({ error: "WebSocket URL not found in database" }, { status: 404 });
    }
  } catch (error) {
    console.error("API Error fetching WebSocket URL:", error);
    return NextResponse.json({ error: "SYSTEM ERROR: Could not connect to database." }, { status: 500 });
  }
}
