
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ran } = body;

    const proxyResponse = await fetch('https://razorhacks.kesug.com/data.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ id, ran }),
    });

    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text();
      return NextResponse.json(
        { message: `Error from proxy: ${errorText}` },
        { status: proxyResponse.status }
      );
    }

    const data = await proxyResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Proxy Error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
