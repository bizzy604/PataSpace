import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';

export function RegisterPage() {
  return (
    <AuthScreenShell
      title="Create your tenant account"
      description="Register once, verify your number with OTP, and carry the same account across browsing, wallet funding, unlocks, confirmations, and support."
      footerPrompt="Already have an account?"
      footerLinkLabel="Sign in"
      footerLinkHref="/auth/sign-in"
      form={
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[#252525]">
              First name
              <Input className="h-11 rounded-2xl" defaultValue="Amina" />
            </label>
            <label className="space-y-2 text-sm font-medium text-[#252525]">
              Last name
              <Input className="h-11 rounded-2xl" defaultValue="Njeri" />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Kenyan phone number
            <Input className="h-11 rounded-2xl" defaultValue="+254701234567" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Email address
            <Input className="h-11 rounded-2xl" defaultValue="amina@pataspace.test" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Password
            <Input className="h-11 rounded-2xl" type="password" defaultValue="SecurePassword123!" />
          </label>

          <div className="rounded-[24px] border border-[#28809A]/14 bg-[#28809A]/6 p-4 text-sm leading-7 text-[#4b4f50]">
            Registration triggers an OTP to the supplied number. The next screen completes verification before wallet and unlock actions are available.
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
              Create account
            </Button>
            <Button variant="outline" className="h-11 rounded-full px-6">
              Use invite code
            </Button>
          </div>
        </form>
      }
    />
  );
}
