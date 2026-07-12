import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";

const FILLER_STRIP = [
  "um",
  "like",
  "basically",
  "you know",
  "sort of",
  "kind of",
  "actually",
  "literally",
  "I mean",
  "so yeah",
];

function FillerMarquee() {
  const items = [...FILLER_STRIP, ...FILLER_STRIP];
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-line py-4"
    >
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap font-mono text-sm uppercase tracking-widest text-muted">
        {items.map((word, i) => (
          <span key={i} className="line-through decoration-accent/70">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

function Filler({ children }: { children: React.ReactNode }) {
  return (
    <mark className="bg-transparent text-accent underline decoration-wavy decoration-1 underline-offset-4">
      {children}
    </mark>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Pick a prompt",
    body: "Interview answer, pitch, hot take, or explain something like I'm five. The clock gives you 60 seconds and zero mercy.",
  },
  {
    number: "02",
    title: "Get roasted",
    body: "Blunt counts every filler, clocks your pace, checks your structure, then reads the critique to your face. Out loud.",
  },
  {
    number: "03",
    title: "Say it again",
    body: "Same prompt, right away, while it stings. Filler count and pace, before and after, side by side. Hear yourself get better.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-2xl uppercase tracking-tight">
          Blunt<span className="text-accent">.</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/coach"
            className="border border-line px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Try the app
          </Link>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Waitlist open
          </span>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 pb-20 pt-16 sm:px-10 sm:pt-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
              AI speech coach
            </p>
            <h1 className="font-display text-[clamp(2.75rem,9vw,7.5rem)] uppercase leading-[0.95] tracking-tight">
              You said &ldquo;like&rdquo;
              <br />
              <span className="text-accent">six times.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/90 sm:text-xl">
              Blunt listens to how you actually talk, roasts what it hears, and
              makes you say it again until the filler is gone. Specific fixes,
              quoted from your own mouth. Never &ldquo;be more confident.&rdquo;
            </p>
            <div className="mt-10 max-w-xl">
              <WaitlistForm source="landing-hero" />
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted">
              Or skip the line and <Link href="/coach" className="text-accent">get roasted now</Link>.
            </p>
          </div>
        </section>

        <FillerMarquee />

        {/* Sample roast */}
        <section className="px-6 py-20 sm:px-10" aria-labelledby="sample-roast">
          <div className="mx-auto max-w-5xl">
            <h2
              id="sample-roast"
              className="mb-10 font-display text-3xl uppercase tracking-tight sm:text-5xl"
            >
              What a roast looks like
            </h2>
            <div className="border border-line">
              <div className="border-b border-line px-5 py-3 font-mono text-xs uppercase tracking-widest text-muted sm:px-8">
                Recording 01 &middot; Interview prep &middot; 0:47
              </div>
              <blockquote className="px-5 py-8 font-mono text-base leading-relaxed text-foreground/90 sm:px-8 sm:text-lg">
                &ldquo;<Filler>So, um</Filler>, I&apos;d say the thing about me
                is, <Filler>like</Filler>, I&apos;m <Filler>basically</Filler> a
                really hard worker and, <Filler>um</Filler>,{" "}
                <Filler>you know</Filler>, I think I&apos;m a team
                player.&rdquo;
              </blockquote>
              <div className="border-t border-line bg-foreground/[0.03] px-5 py-8 sm:px-8">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
                  Blunt&apos;s notes
                </p>
                <p className="max-w-3xl text-base leading-relaxed text-foreground/90 sm:text-lg">
                  Five fillers in twelve seconds. &ldquo;Basically&rdquo; and
                  &ldquo;you know&rdquo; are doing nothing for you.
                  &ldquo;I think I&apos;m a team player&rdquo; is a shrug, not a
                  sentence. Try: &ldquo;I ship fast and people fight to get me
                  on their team.&rdquo; Again. From the top.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          className="border-t border-line px-6 py-20 sm:px-10"
          aria-labelledby="how-it-works"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="how-it-works"
              className="mb-12 font-display text-3xl uppercase tracking-tight sm:text-5xl"
            >
              How it works
            </h2>
            <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((step) => (
                <div key={step.number}>
                  <p className="font-display text-6xl text-accent sm:text-7xl">
                    {step.number}
                  </p>
                  <h3 className="mt-4 font-display text-xl uppercase tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-foreground/80">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-14 max-w-2xl font-mono text-sm leading-relaxed text-muted">
              The re-record is the product. Grading you and walking away is
              what every other speaking app already does.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          className="border-t border-line px-6 py-24 sm:px-10"
          aria-labelledby="bottom-cta"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="bottom-cta"
              className="font-display text-[clamp(2.25rem,7vw,5.5rem)] uppercase leading-[0.95] tracking-tight"
            >
              Get roasted
              <br />
              <span className="text-accent">first.</span>
            </h2>
            <div className="mt-10 max-w-xl">
              <WaitlistForm source="landing-footer" />
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t border-line px-6 py-8 font-mono text-xs uppercase tracking-widest text-muted sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span>Blunt speaks English only at launch</span>
        <span>&copy; 2026 Blunt</span>
      </footer>
    </div>
  );
}
