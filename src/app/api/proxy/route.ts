
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
      console.error(`Error from external service: ${errorText}`);
      return NextResponse.json(
        { message: `Error from proxy target: ${proxyResponse.statusText}` },
        { status: proxyResponse.status }
      );
    }
    
    const contentType = proxyResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await proxyResponse.json();
        return NextResponse.json(data);
    } else {
        const textData = await proxyResponse.text();
        console.error("Proxy received non-JSON response from external service:", textData);
        return NextResponse.json(
            { message: 'The remote service returned an invalid response format.' },
            { status: 502 } // Bad Gateway
        );
    }

  } catch (error) {
    console.error('API Proxy Error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
