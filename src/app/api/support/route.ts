
import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

const BOT_TOKEN = '7695139336:AAGFDIXrQSc3t2Q4ZDCoJ4JAk-0L-7AUUVU';
// Important: Replace this with the actual Chat ID of the support group/person
const CHAT_ID = '-4333010530'; // This is a placeholder, you must get the correct one

const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const message = data.get('message') as string;
    const photo = data.get('photo') as File | null;
    
    const userId = request.headers.get('x-user-id') || 'Unknown User';

    const caption = `New Support Message\n\nUser ID: ${userId}\n\nMessage:\n${message || '(No message content)'}`;

    if (photo) {
      // Sending a photo
      const photoForm = new FormData();
      photoForm.append('chat_id', CHAT_ID);
      photoForm.append('photo', photo.stream(), {
        filename: photo.name,
        contentType: photo.type,
      });
      photoForm.append('caption', caption);
      
      const response = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, photoForm, {
        headers: photoForm.getHeaders(),
      });

      if (response.data.ok) {
        return NextResponse.json({ success: true, message: 'Message and photo sent.' });
      } else {
        throw new Error(`Telegram API Error: ${response.data.description}`);
      }

    } else if (message) {
      // Sending a text message
      const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: CHAT_ID,
        text: caption,
        parse_mode: 'Markdown',
      });
      
      if (response.data.ok) {
        return NextResponse.json({ success: true, message: 'Message sent.' });
      } else {
        throw new Error(`Telegram API Error: ${response.data.description}`);
      }
    } else {
        return NextResponse.json({ success: false, message: 'No content to send.' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error sending to Telegram:', error);
    let errorMessage = 'An internal server error occurred.';
    if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Failed to send message: ${error.response.data.description || error.message}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
