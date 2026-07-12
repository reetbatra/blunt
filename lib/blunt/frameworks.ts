import type { CoachPrompt, FrameworkUsed, PromptCategory } from "@/lib/blunt/types";

export type FrameworkRecommendation = {
  name: string;
  shortLabel: string;
  why: string;
  steps: string[];
  exampleOpener: string;
  fallbackWhenMissing: string;
};

const RECOMMENDATIONS: Record<PromptCategory, FrameworkRecommendation> = {
  interview: {
    name: "STAR",
    shortLabel: "Situation -> Task -> Action -> Result",
    why: "Interview answers die when you ramble before proving anything. STAR forces receipts.",
    steps: [
      "Situation: one sentence of context, not your life story.",
      "Task: state the problem or target clearly.",
      "Action: explain what you did, not what the team vaguely felt.",
      "Result: end with the measurable outcome or decision won.",
    ],
    exampleOpener:
      "The reason to hire me is simple: when a launch was slipping, I rebuilt the plan, cut the noise, and we still shipped on time.",
    fallbackWhenMissing:
      "You need a result on the table early. If the interviewer still does not know the win by sentence two, you are drifting.",
  },
  impromptu: {
    name: "PREP",
    shortLabel: "Point -> Reason -> Example -> Point",
    why: "Impromptu answers collapse when they start wandering. PREP gives you one spine fast.",
    steps: [
      "Point: say the take immediately.",
      "Reason: explain why that take is true.",
      "Example: give one vivid example, not three weak ones.",
      "Point: land the thought again in cleaner words.",
    ],
    exampleOpener:
      "My take is that boredom is useful because it forces original thought instead of endless scrolling.",
    fallbackWhenMissing:
      "Lead with the claim. If the listener has to wait for your point, you already lost pace and authority.",
  },
  "hot-take": {
    name: "PREP",
    shortLabel: "Point -> Reason -> Example -> Point",
    why: "A hot take without structure just sounds like a loose complaint. PREP makes it sound intentional.",
    steps: [
      "Point: open with the hot take in one sharp sentence.",
      "Reason: say why the take holds up.",
      "Example: use one concrete example that proves the point.",
      "Point: close by restating the take harder and cleaner.",
    ],
    exampleOpener:
      "My hot take is that most productivity advice is theater, because it optimizes looking organized instead of getting hard work done.",
    fallbackWhenMissing:
      "Do not throat-clear. Say the fight-starting sentence first, then defend it like you meant to pick the fight.",
  },
  eli5: {
    name: "PREP",
    shortLabel: "Point -> Reason -> Example -> Point",
    why: "ELI5 works when the idea gets simpler every sentence, not more technical every sentence.",
    steps: [
      "Point: say what the thing is in plain English.",
      "Reason: explain what job it does.",
      "Example: compare it to one everyday object or moment.",
      "Point: restate the idea in one clean sentence.",
    ],
    exampleOpener:
      "A database is a memory cabinet for software: it stores information so the app can find the right thing fast later.",
    fallbackWhenMissing:
      "If a smart twelve-year-old would stop you and ask what you mean, your explanation is still too muddy.",
  },
  pitch: {
    name: "PREP",
    shortLabel: "Point -> Reason -> Example -> Point",
    why: "Pitches fail when the listener hears features before the problem. PREP keeps the value obvious.",
    steps: [
      "Point: state the problem and your solution in one line.",
      "Reason: explain why the problem hurts enough to matter.",
      "Example: give one user moment or result that makes it real.",
      "Point: close on the payoff, not a generic tagline.",
    ],
    exampleOpener:
      "We help overwhelmed teams stop meeting about work by turning scattered updates into one clear decision stream.",
    fallbackWhenMissing:
      "If the room cannot repeat what you solve after ten seconds, your pitch is decorative noise.",
  },
};

export function getFrameworkRecommendation(
  prompt: CoachPrompt,
  detectedFramework: FrameworkUsed,
) {
  const recommendation = RECOMMENDATIONS[prompt.category];
  const isAlreadyUsingIt =
    detectedFramework !== null &&
    detectedFramework !== "none" &&
    detectedFramework === recommendation.name;

  return {
    ...recommendation,
    isAlreadyUsingIt,
  };
}
