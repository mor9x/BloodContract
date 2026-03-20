import { requestGraphQL, type GraphQLClientConfig } from "../graphql/client";
import { GET_KILLMAIL_CREATED_EVENTS } from "../graphql/documents/killmail";
import { toConnectionPage } from "../graphql/pagination";
import type { ConnectionPage, PageInfo } from "../types/graphql";
import type { KillmailEvent, TenantItemIdJson } from "../types/killmail";

export type QueryKillmailEventsArgs = {
  packageId: string;
  first?: number;
  after?: string | null;
};

type KillmailEventNode = {
  eventType?: string | null;
  timestamp?: string | null;
  contents?: {
    json?: Record<string, unknown> | null;
  } | null;
  transactionBlock?: {
    digest?: string | null;
  } | null;
};

type KillmailEventsResponse = {
  events?: {
    nodes?: KillmailEventNode[];
    pageInfo?: {
      hasNextPage?: boolean | null;
      endCursor?: string | null;
    } | null;
  } | null;
};

export function getKillmailCreatedEventType(packageId: string) {
  return `${packageId}::killmail::KillmailCreatedEvent`;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toTenantItemId(value: unknown): TenantItemIdJson | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    itemId: toNullableNumber(record.item_id),
    tenant: typeof record.tenant === "string" ? record.tenant : null
  };
}

function mapKillmailEvent(node: KillmailEventNode): KillmailEvent {
  const contentsJson = node.contents?.json ?? {};
  const killmailItemId = toTenantItemId(contentsJson.key)?.itemId ?? null;

  return {
    eventType: node.eventType ?? "",
    timestamp: node.timestamp ?? null,
    digest: node.transactionBlock?.digest ?? null,
    killmailItemId,
    killerId: toTenantItemId(contentsJson.killer_id),
    victimId: toTenantItemId(contentsJson.victim_id),
    reportedByCharacterId: toTenantItemId(contentsJson.reported_by_character_id),
    solarSystemId: toTenantItemId(contentsJson.solar_system_id),
    lossType: typeof contentsJson.loss_type === "string" ? contentsJson.loss_type : null,
    killTimestamp: toNullableNumber(contentsJson.kill_timestamp),
    contentsJson
  };
}

function mapPageInfo(pageInfo?: { hasNextPage?: boolean | null; endCursor?: string | null } | null): PageInfo {
  return {
    hasNextPage: pageInfo?.hasNextPage ?? false,
    endCursor: pageInfo?.endCursor ?? null
  };
}

export async function queryKillmailEvents(
  config: GraphQLClientConfig,
  args: QueryKillmailEventsArgs
): Promise<ConnectionPage<KillmailEvent>> {
  const data = await requestGraphQL<KillmailEventsResponse, { eventType: string; first: number; after: string | null }>(
    config,
    {
      query: GET_KILLMAIL_CREATED_EVENTS,
      variables: {
        eventType: getKillmailCreatedEventType(args.packageId),
        first: args.first ?? 10,
        after: args.after ?? null
      }
    }
  );

  return toConnectionPage((data.events?.nodes ?? []).map(mapKillmailEvent), mapPageInfo(data.events?.pageInfo));
}
