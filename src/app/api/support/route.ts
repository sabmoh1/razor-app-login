
import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, push, serverTimestamp } from "firebase/database";

export async function POST(request: Request) {
  try {
    const { telegramUser, message } = await request.json();

    if (!telegramUser || !message) {
      return NextResponse.json({ success: false, message: 'Telegram username and message are required.' }, { status: 400 });
    }

    const supportMessagesRef = ref(database, 'nasserusdt_support');
    
    await push(supportMessagesRef, {
      telegramUser,
      message,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Message saved.' });

  } catch (error) {
    console.error('Error saving support message:', error);
    let errorMessage = 'An internal server error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
