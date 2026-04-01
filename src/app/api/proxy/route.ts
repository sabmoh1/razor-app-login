
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
      return NextResponse.json(
        { message: `Error from proxy source: ${proxyResponse.statusText}` },
        { status: proxyResponse.status }
      );
    }
    
    const contentType = proxyResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await proxyResponse.json();
        return NextResponse.json(data);
    } else {
        // If not JSON, it might be an error page or raw text
        const textData = await proxyResponse.text();
        console.warn("Non-JSON response received:", textData.substring(0, 100));
        return NextResponse.json(
            { message: 'The remote service returned an invalid response format. Please try again.' },
            { status: 502 }
        );
    }

  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
        { message: 'Internal server error occurred while processing your request.' }, 
        { status: 500 }
    );
  }
}
