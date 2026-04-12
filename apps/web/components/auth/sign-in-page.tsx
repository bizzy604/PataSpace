import Link from 'next/link';
import { KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';

export function SignInPage() {
  return (
    <AuthScreenShell
      title="Welcome back to your tenant workspace"
      description="Sign in with the same verified phone number you use for wallet top-ups, unlocks, confirmations, and support follow-through."
      footerPrompt="Need a new account?"
      footerLinkLabel="Register first"
      footerLinkHref="/auth/register"
      form={
        <form className="space-y-4">
          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Kenyan phone number
            <Input className="h-11 rounded-2xl" defaultValue="+254701234567" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Password
            <Input className="h-11 rounded-2xl" type="password" defaultValue="SecurePassword123!" />
          </label>

          <div className="grid gap-3 rounded-[24px] border border-black/8 bg-[#f7f4ee] p-4 text-sm text-[#4b4f50] sm:grid-cols-3">
            {[
              {
                title: 'Phone verified',
                body: 'Unlock, wallet, and support activity stays anchored to one number.',
                Icon: Smartphone,
              },
              {
                title: 'Protected actions',
                body: 'Signed-in sessions can continue payment and unlock follow-through safely.',
                Icon: ShieldCheck,
              },
              {
                title: 'Recovery path',
                body: 'Forgotten-password and OTP help stays available through support.',
                Icon: KeyRound,
              },
            ].map(({ title, body, Icon }) => (
              <div key={title} className="rounded-[20px] bg-white p-4">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-[#28809A]/10 text-[#28809A]">
                  <Icon className="size-5" />
                </span>
                <p className="mt-3 font-medium text-[#252525]">{title}</p>
                <p className="mt-2 text-xs leading-6 text-[#62686a]">{body}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <Link href="/auth/verify-otp" className="font-medium text-[#28809A]">
              Use OTP instead
            </Link>
            <Link href="/support" className="text-[#62686a] transition hover:text-[#252525]">
              Forgot password?
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
              Sign in
            </Button>
            <Button variant="outline" className="h-11 rounded-full px-6">
              Request magic link
            </Button>
          </div>
        </form>
      }
    />
  );
}
