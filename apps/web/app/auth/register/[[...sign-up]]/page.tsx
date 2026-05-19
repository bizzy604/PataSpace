import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <SignUp path="/auth/register" routing="path" signInUrl="/auth/sign-in" />
    </main>
  );
}
