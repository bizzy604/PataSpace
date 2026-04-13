import { SignIn } from '@clerk/nextjs';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';

export default function Page() {
  return (
    <PublicSiteFrame>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-black/8 bg-[#252525] p-8 text-white shadow-[0_28px_90px_rgba(37,37,37,0.18)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ed7e7]">
              Clerk authentication
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.07em]">
              Sign in to continue your tenant workspace.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              Use the same account across browsing, wallet funding, unlocks, confirmations, and support.
              Clerk now handles the full web sign-in flow for PataSpace.
            </p>
          </div>

          <div className="flex justify-center rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_28px_90px_rgba(37,37,37,0.1)] sm:p-8">
            <SignIn path="/auth/sign-in" routing="path" signUpUrl="/auth/register" />
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}
