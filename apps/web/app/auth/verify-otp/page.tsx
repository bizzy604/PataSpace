import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';

export default function Page() {
  return (
    <AuthScreenShell
      title="Verify your phone number"
      description="OTP verification is required before protected actions like buying credits, unlocking contact details, and confirming a move-in can go through."
      footerPrompt="Wrong number or expired code?"
      footerLinkLabel="Back to register"
      footerLinkHref="/auth/register"
      form={
        <form className="space-y-4">
          <label className="space-y-2 text-sm font-medium text-[#252525]">
            Phone number
            <Input className="h-11 rounded-2xl bg-[#f7f4ee]" defaultValue="+254701234567" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#252525]">
            6-digit OTP code
            <Input className="h-11 rounded-2xl text-center text-lg tracking-[0.45em]" defaultValue="123456" />
          </label>

          <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-4 text-sm leading-7 text-[#62686a]">
            Test and sandbox environments currently accept <span className="font-semibold text-[#252525]">123456</span>. Production uses a fresh OTP with a short expiry window.
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
              Verify and continue
            </Button>
            <Button variant="outline" className="h-11 rounded-full px-6">
              Resend OTP
            </Button>
          </div>
        </form>
      }
    />
  );
}
