import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RAZOR',
  description: 'RAZOR Terminal',
  icons: {
    icon: 'https://storage.googleapis.com/deis-project.appspot.com/6c20f12c-35a6-4328-8253-13897818b2c4.png',
    apple: 'https://storage.googleapis.com/deis-project.appspot.com/6c20f12c-35a6-4328-8253-13897818b2c4.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
