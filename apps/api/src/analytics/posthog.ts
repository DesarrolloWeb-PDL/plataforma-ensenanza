import { PostHog } from "posthog-node";

export function createPostHog(apiKey?: string, host?: string): PostHog | undefined {
  if (!apiKey) return undefined;
  return new PostHog(apiKey, { host: host ?? "https://us.i.posthog.com" });
}