export type KillmailLossType = "SHIP" | "STRUCTURE" | string;

export type TenantItemIdJson = {
  itemId: number | null;
  tenant: string | null;
};

export type KillmailEvent = {
  eventType: string;
  timestamp: string | null;
  digest: string | null;
  killmailItemId: number | null;
  killerId: TenantItemIdJson | null;
  victimId: TenantItemIdJson | null;
  reportedByCharacterId: TenantItemIdJson | null;
  solarSystemId: TenantItemIdJson | null;
  lossType: KillmailLossType | null;
  killTimestamp: number | null;
  contentsJson: Record<string, unknown>;
};
