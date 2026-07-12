import type { CoachPrompt, PromptCategory } from "@/lib/blunt/types";

const PROMPT_BANK: Record<
  PromptCategory,
  Array<{ label: string; text: string }>
> = {
  interview: [
    {
      label: "Interview prep",
      text: "Tell me about a time you disagreed with a teammate and still got the work shipped.",
    },
    {
      label: "Interview prep",
      text: "Why should I hire you for this role over someone who is just cleaner and calmer on the mic?",
    },
    {
      label: "Interview prep",
      text: "Describe a project you are proud of without hiding behind buzzwords or a team-sized fog cloud.",
    },
  ],
  impromptu: [
    {
      label: "Impromptu",
      text: "You have 45 seconds to explain why mornings are overrated. Make it coherent.",
    },
    {
      label: "Impromptu",
      text: "Argue for bringing back one dead internet habit and make me believe it matters.",
    },
    {
      label: "Impromptu",
      text: "Convince a room of strangers that boredom is useful instead of embarrassing.",
    },
  ],
  "hot-take": [
    {
      label: "Hot take",
      text: "Give me a hot take about remote work that would start a fight in a group chat.",
    },
    {
      label: "Hot take",
      text: "What is the most overrated productivity advice people keep repeating like it is scripture?",
    },
    {
      label: "Hot take",
      text: "Pick a mainstream app and explain why it secretly makes people worse at thinking.",
    },
  ],
  eli5: [
    {
      label: "ELI5",
      text: "Explain how venture capital works like you are talking to a smart eight-year-old.",
    },
    {
      label: "ELI5",
      text: "Explain what a database is without sounding like you swallowed a textbook.",
    },
    {
      label: "ELI5",
      text: "Explain inflation to a kid who only understands snacks and allowance money.",
    },
  ],
  pitch: [
    {
      label: "Pitch",
      text: "Pitch a tool that helps overwhelmed teams stop drowning in meetings.",
    },
    {
      label: "Pitch",
      text: "Sell me a product that fixes one tiny but universal annoyance people complain about every day.",
    },
    {
      label: "Pitch",
      text: "Pitch your startup in under a minute without saying AI, platform, synergy, or revolutionize.",
    },
  ],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function getPrompt(category: PromptCategory, seed?: number): CoachPrompt {
  const prompts = PROMPT_BANK[category];
  const index =
    typeof seed === "number"
      ? Math.abs(seed) % prompts.length
      : Math.floor(Math.random() * prompts.length);
  const prompt = prompts[index];
  return {
    id: `${category}-${slugify(prompt.text)}`,
    category,
    label: prompt.label,
    text: prompt.text,
  };
}

export function isPromptCategory(value: string): value is PromptCategory {
  return Object.hasOwn(PROMPT_BANK, value);
}
