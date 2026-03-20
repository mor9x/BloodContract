import { requestGraphQL, type GraphQLClientConfig } from "../graphql/client";
import { GET_KILLMAIL_CREATED_EVENTS } from "../graphql/documents/killmail";
import { toConnectionPage } from "../graphql/pagination";
import type { ConnectionEdge, ConnectionPage, PageInfo } from "../types/graphql";
import type { KillmailEvent } from "../types/killmail";
import { type GraphQLEventEdge, type GraphQLEventNode, toMoveEnumVariant, toNullableNumber, toTenantItemId } from "./helpers";

export type QueryKillmailEventsArgs = {
  packageId: string;
  first?: number;
  after?: string | null;
};

type KillmailEventsResponse = {
  events?: {
    edges?: GraphQLEventEdge[];
    pageInfo?: {
      hasNextPage?: boolean | null;
      endCursor?: string | null;
    } | null;
  } | null;
};

export function getKillmailCreatedEventType(packageId: string) {
  return `${packageId}::killmail::KillmailCreatedEvent`;
}

function mapKillmailEvent(node: GraphQLEventNode, eventType: string): KillmailEvent {
  const contentsJson = node.contents?.json ?? {};
  const killmailItemId = toTenantItemId(contentsJson.key)?.itemId ?? null;

  return {
    eventType,
    timestamp: node.timestamp ?? null,
    digest: node.transaction?.digest ?? null,
    killmailItemId,
    killerId: toTenantItemId(contentsJson.killer_id),
    victimId: toTenantItemId(contentsJson.victim_id),
    reportedByCharacterId: toTenantItemId(contentsJson.reported_by_character_id),
    solarSystemId: toTenantItemId(contentsJson.solar_system_id),
    lossType: toMoveEnumVariant(contentsJson.loss_type),
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
  const eventType = getKillmailCreatedEventType(args.packageId);
  const data = await requestGraphQL<KillmailEventsResponse, { eventType: string; first: number; after: string | null }>(
    config,
    {
      query: GET_KILLMAIL_CREATED_EVENTS,
      variables: {
        eventType,
        first: args.first ?? 10,
        after: args.after ?? null
      }
    }
  );

  const edges: ConnectionEdge<KillmailEvent>[] = (data.events?.edges ?? [])
    .filter((edge): edge is GraphQLEventEdge & { cursor: string; node: GraphQLEventNode } =>
      typeof edge?.cursor === "string" && !!edge.node
    )
    .map((edge) => ({
      cursor: edge.cursor,
      node: mapKillmailEvent(edge.node, eventType)
    }));

  return toConnectionPage(edges.map((edge) => edge.node), mapPageInfo(data.events?.pageInfo), edges);
}
