import type { TenantItemIdJson } from "./killmail";

export type BountyBoardEventName =
  | "SingleBountyCreatedEvent"
  | "SingleBountyFundedEvent"
  | "SingleBountySettledEvent"
  | "SingleBountyClosedEvent"
  | "MultiBountyCreatedEvent"
  | "MultiBountyFundedEvent"
  | "MultiBountyKillRecordedEvent"
  | "MultiBountyClosedEvent"
  | "InsuranceCreatedEvent"
  | "InsuranceFundedEvent"
  | "InsuranceTriggeredEvent"
  | "InsuranceClosedEvent";

type BaseBountyBoardEvent = {
  kind: BountyBoardEventName;
  eventType: string;
  timestamp: string | null;
  digest: string | null;
};

export type SingleBountyCreatedEvent = BaseBountyBoardEvent & {
  kind: "SingleBountyCreatedEvent";
  bountyId: string | null;
  boardId: string | null;
  targetKey: TenantItemIdJson | null;
  lossFilter: number | null;
  coinType: string | null;
  expiresAtMs: number | null;
  note: string | null;
};

export type SingleBountyFundedEvent = BaseBountyBoardEvent & {
  kind: "SingleBountyFundedEvent";
  bountyId: string | null;
  contributorKey: TenantItemIdJson | null;
  addedAmount: number | null;
  expiresAtMs: number | null;
};

export type SingleBountySettledEvent = BaseBountyBoardEvent & {
  kind: "SingleBountySettledEvent";
  bountyId: string | null;
  hunterKey: TenantItemIdJson | null;
  killmailItemId: number | null;
};

export type SingleBountyClosedEvent = BaseBountyBoardEvent & {
  kind: "SingleBountyClosedEvent";
  bountyId: string | null;
};

export type MultiBountyCreatedEvent = BaseBountyBoardEvent & {
  kind: "MultiBountyCreatedEvent";
  bountyId: string | null;
  boardId: string | null;
  targetKey: TenantItemIdJson | null;
  lossFilter: number | null;
  targetKills: number | null;
  perKillReward: number | null;
  coinType: string | null;
  expiresAtMs: number | null;
  note: string | null;
};

export type MultiBountyFundedEvent = BaseBountyBoardEvent & {
  kind: "MultiBountyFundedEvent";
  bountyId: string | null;
  contributorKey: TenantItemIdJson | null;
  addedAmount: number | null;
  expiresAtMs: number | null;
  perKillReward: number | null;
};

export type MultiBountyKillRecordedEvent = BaseBountyBoardEvent & {
  kind: "MultiBountyKillRecordedEvent";
  bountyId: string | null;
  hunterKey: TenantItemIdJson | null;
  killmailItemId: number | null;
  recordedKills: number | null;
};

export type MultiBountyClosedEvent = BaseBountyBoardEvent & {
  kind: "MultiBountyClosedEvent";
  bountyId: string | null;
};

export type InsuranceCreatedEvent = BaseBountyBoardEvent & {
  kind: "InsuranceCreatedEvent";
  orderId: string | null;
  boardId: string | null;
  insuredKey: TenantItemIdJson | null;
  lossFilter: number | null;
  spawnMode: number | null;
  spawnTargetKills: number | null;
  coinType: string | null;
  expiresAtMs: number | null;
  note: string | null;
};

export type InsuranceFundedEvent = BaseBountyBoardEvent & {
  kind: "InsuranceFundedEvent";
  orderId: string | null;
  addedAmount: number | null;
  expiresAtMs: number | null;
};

export type InsuranceTriggeredEvent = BaseBountyBoardEvent & {
  kind: "InsuranceTriggeredEvent";
  orderId: string | null;
  generatedBountyId: string | null;
  killerKey: TenantItemIdJson | null;
  killmailItemId: number | null;
  spawnMode: number | null;
  spawnTargetKills: number | null;
  expiresAtMs: number | null;
};

export type InsuranceClosedEvent = BaseBountyBoardEvent & {
  kind: "InsuranceClosedEvent";
  orderId: string | null;
};

export type BountyBoardLifecycleEvent =
  | SingleBountyCreatedEvent
  | SingleBountyFundedEvent
  | SingleBountySettledEvent
  | SingleBountyClosedEvent
  | MultiBountyCreatedEvent
  | MultiBountyFundedEvent
  | MultiBountyKillRecordedEvent
  | MultiBountyClosedEvent
  | InsuranceCreatedEvent
  | InsuranceFundedEvent
  | InsuranceTriggeredEvent
  | InsuranceClosedEvent;
