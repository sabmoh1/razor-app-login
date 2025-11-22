'use server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
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

export async function GET(request: Request) {
    try {
        const wsUrlRef = ref(database, 'websocket_url');
        const snapshot = await get(wsUrlRef);
        if (snapshot.exists()) {
            const url = snapshot.val();
            return NextResponse.json({ url: url }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'WebSocket URL not found' }, { status: 404 });
        }
    } catch (error: any) {
        console.error('API-Error:', error);
        return NextResponse.json({ message: 'SYSTEM ERROR: Could not connect to the server.' }, { status: 500 });
    }
}
