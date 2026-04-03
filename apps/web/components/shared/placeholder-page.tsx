interface PlaceholderPageProps {
  title: string;
  routePath: string;
}

export function PlaceholderPage({ title, routePath }: PlaceholderPageProps) {
  return (
    <section className="flex min-h-screen bg-white px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center">
        <div className="w-full py-16 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-foreground-tertiary">Placeholder</p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.05em] text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-sm text-foreground-tertiary">{routePath}</p>
        </div>
      </div>
    </section>
  );
}
