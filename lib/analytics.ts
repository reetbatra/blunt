export type BluntEventName =
  | "prompt_spun"
  | "first_take_started"
  | "first_take_scored"
  | "redo_started"
  | "redo_completed"
  | "full_loop_completed";

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

export function trackEvent(
  eventName: BluntEventName,
  props?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") {
    return;
  }

  window.plausible(eventName, props ? { props } : undefined);
}
