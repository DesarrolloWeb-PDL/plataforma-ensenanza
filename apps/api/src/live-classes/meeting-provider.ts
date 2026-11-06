import { randomUUID } from "node:crypto";

export interface MeetingCreateInput {
  title: string;
  scheduledAt: string;
  durationMin: number;
  meetingUrl?: string;
}

export interface MeetingCreateResult {
  meetingUrl: string;
  provider: string;
}

export interface MeetingProvider {
  readonly name: string;
  create(input: MeetingCreateInput): Promise<MeetingCreateResult>;
}

export class ExternalLinkMeetingProvider implements MeetingProvider {
  readonly name = "external-link";

  async create(input: MeetingCreateInput): Promise<MeetingCreateResult> {
    return {
      meetingUrl: input.meetingUrl ?? `https://meet.example.com/${randomUUID()}`,
      provider: this.name,
    };
  }
}

export function createMeetingProvider(name?: string): MeetingProvider {
  void name;
  return new ExternalLinkMeetingProvider();
}