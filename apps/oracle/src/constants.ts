export const LOSS_ANY = 0;
export const LOSS_SHIP = 1;
export const LOSS_STRUCTURE = 2;

export const MODE_SINGLE = 1;
export const MODE_MULTI = 2;

export const CLOCK_OBJECT_ID = "0x6";

export const BOUNTY_EVENT_STREAMS = [
  "SingleBountyCreatedEvent",
  "MultiBountyCreatedEvent",
  "InsuranceCreatedEvent",
  "SingleBountyFundedEvent",
  "MultiBountyFundedEvent",
  "InsuranceFundedEvent",
  "SingleBountySettledEvent",
  "MultiBountyKillRecordedEvent",
  "InsuranceTriggeredEvent",
  "SingleBountyClosedEvent",
  "MultiBountyClosedEvent",
  "InsuranceClosedEvent"
] as const;

export const KILLMAIL_STREAM = "world.killmail.created";
