import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';

export default function Page() {
  return (
    <AuthScreenShell
      title="Sign back into your workspace"
      description="Tenant web access is designed around repeat activity: checking wallet balance, revisiting unlocks, confirming move-ins, and following disputes without re-entering data each time."
      footerPrompt="Need a new account?"
      footerLinkLabel="Register"
      footerLinkHref="/auth/register"
      form={
        <form className="space-y-4">
          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Phone number
            <Input className="h-11 rounded-2xl" defaultValue="+254701234567" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Password
            <Input className="h-11 rounded-2xl" type="password" defaultValue="SecurePassword123!" />
          </label>

          <div className="flex items-center justify-between rounded-[24px] border border-black/8 bg-[#f7f4ee] p-4 text-sm text-[#62686a]">
            <span>Phone verification stays tied to your account for unlock and wallet actions.</span>
            <Button variant="link" className="h-auto px-0 text-[#28809A]">
              Forgot password
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
              Sign in
            </Button>
            <Button variant="outline" className="h-11 rounded-full px-6">
              Continue with OTP
            </Button>
          </div>
        </form>
      }
    />
  );
}
