export type KillmailEvent = {
  eventType: string;
  timestamp: string | null;
  digest: string | null;
  contentsJson: Record<string, unknown>;
};
