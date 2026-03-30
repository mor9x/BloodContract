import type { TenantItemIdJson } from "./killmail";

export type BoardState = {
  objectId: string;
  schemaVersion: number;
  minDurationDays: number;
  maxDurationDays: number;
  maxNoteBytes: number;
  activeSingleBountyIds: string[];
  activeMultiBountyIds: string[];
  activeInsuranceOrderIds: string[];
};

type ActiveRewardBoardRecordBase = {
  objectId: string;
  lossFilter: number;
  coinType: string;
  rewardAmount: number;
  note: string | null;
  expiresAtMs: number;
  claimableByHunter: Array<{
    key: TenantItemIdJson;
    amount: number;
  }>;
  contributions: Array<{
    key: TenantItemIdJson;
    amount: number;
  }>;
};

export type ActiveSingleBoardRecord = ActiveRewardBoardRecordBase & {
  kind: "single";
  target: TenantItemIdJson;
  settled: boolean;
  usedKillmailItemIds: number[];
};

export type ActiveMultiBoardRecord = ActiveRewardBoardRecordBase & {
  kind: "multi";
  target: TenantItemIdJson;
  settled: boolean;
  usedKillmailItemIds: number[];
  targetKills: number;
  recordedKills: number;
  perKillReward: number;
};

export type ActiveInsuranceBoardRecord = {
  kind: "insurance";
  objectId: string;
  insured: TenantItemIdJson;
  lossFilter: number;
  coinType: string;
  rewardAmount: number;
  note: string | null;
  expiresAtMs: number;
  spawnMode: number;
  spawnTargetKills: number;
};

export type BoardObjectState = ActiveSingleBoardRecord | ActiveMultiBoardRecord | ActiveInsuranceBoardRecord;

export type BoardRegistrySnapshot = {
  board: BoardState;
  singles: ActiveSingleBoardRecord[];
  multis: ActiveMultiBoardRecord[];
  insurances: ActiveInsuranceBoardRecord[];
};
