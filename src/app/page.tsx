import CreatePasswordForm from '@/components/create-password-form';
import LoginForm from '@/components/login-form';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-black">
      <div className="absolute top-4 right-4">
        <CreatePasswordForm adminPassword={'ZR1'} />
      </div>
      <LoginForm />
    </main>
  );
}
