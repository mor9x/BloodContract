import { requestGraphQL, type GraphQLClientConfig } from "../graphql/client";
import { GET_EVENTS_BY_TYPE } from "../graphql/documents/events";
import { toConnectionPage } from "../graphql/pagination";
import type { BountyBoardEventName, BountyBoardLifecycleEvent } from "../types/bounty-board";
import type { ConnectionEdge, ConnectionPage, PageInfo } from "../types/graphql";
import { type GraphQLEventEdge, type GraphQLEventNode, toNullableNumber, toNullableString, toTenantItemId } from "./helpers";

export type QueryBountyBoardEventsArgs = {
  packageId: string;
  eventName: BountyBoardEventName;
  first?: number;
  after?: string | null;
};

type BountyBoardEventsResponse = {
  events?: {
    edges?: GraphQLEventEdge[];
    pageInfo?: {
      hasNextPage?: boolean | null;
      endCursor?: string | null;
    } | null;
  } | null;
};

export function getBountyBoardEventType(packageId: string, eventName: BountyBoardEventName) {
  return `${packageId}::bounty_board::${eventName}`;
}

function mapPageInfo(pageInfo?: { hasNextPage?: boolean | null; endCursor?: string | null } | null): PageInfo {
  return {
    hasNextPage: pageInfo?.hasNextPage ?? false,
    endCursor: pageInfo?.endCursor ?? null
  };
}

function baseEvent<TKind extends BountyBoardEventName>(kind: TKind, node: GraphQLEventNode, eventType: string) {
  return {
    kind,
    eventType,
    timestamp: node.timestamp ?? null,
    digest: node.transaction?.digest ?? null
  };
}

function mapLifecycleNode(eventName: BountyBoardEventName, node: GraphQLEventNode, eventType: string): BountyBoardLifecycleEvent {
  const json = node.contents?.json ?? {};

  switch (eventName) {
    case "SingleBountyCreatedEvent":
      return {
        ...baseEvent("SingleBountyCreatedEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id),
        boardId: toNullableString(json.board_id),
        targetKey: toTenantItemId(json.target_key),
        lossFilter: toNullableNumber(json.loss_filter),
        coinType: toNullableString(json.coin_type),
        expiresAtMs: toNullableNumber(json.expires_at_ms),
        note: toNullableString(json.note)
      };
    case "SingleBountyFundedEvent":
      return {
        ...baseEvent("SingleBountyFundedEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id),
        contributorKey: toTenantItemId(json.contributor_key),
        addedAmount: toNullableNumber(json.added_amount),
        expiresAtMs: toNullableNumber(json.expires_at_ms)
      };
    case "SingleBountySettledEvent":
      return {
        ...baseEvent("SingleBountySettledEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id),
        hunterKey: toTenantItemId(json.hunter_key),
        killmailItemId: toNullableNumber(json.killmail_item_id)
      };
    case "SingleBountyClosedEvent":
      return {
        ...baseEvent("SingleBountyClosedEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id)
      };
    case "MultiBountyCreatedEvent":
      return {
        ...baseEvent("MultiBountyCreatedEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id),
        boardId: toNullableString(json.board_id),
        targetKey: toTenantItemId(json.target_key),
        lossFilter: toNullableNumber(json.loss_filter),
        targetKills: toNullableNumber(json.target_kills),
        perKillReward: toNullableNumber(json.per_kill_reward),
        coinType: toNullableString(json.coin_type),
        expiresAtMs: toNullableNumber(json.expires_at_ms),
        note: toNullableString(json.note)
      };
    case "MultiBountyFundedEvent":
      return {
        ...baseEvent("MultiBountyFundedEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id),
        contributorKey: toTenantItemId(json.contributor_key),
        addedAmount: toNullableNumber(json.added_amount),
        expiresAtMs: toNullableNumber(json.expires_at_ms),
        perKillReward: toNullableNumber(json.per_kill_reward)
      };
    case "MultiBountyKillRecordedEvent":
      return {
        ...baseEvent("MultiBountyKillRecordedEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id),
        hunterKey: toTenantItemId(json.hunter_key),
        killmailItemId: toNullableNumber(json.killmail_item_id),
        recordedKills: toNullableNumber(json.recorded_kills)
      };
    case "MultiBountyClosedEvent":
      return {
        ...baseEvent("MultiBountyClosedEvent", node, eventType),
        bountyId: toNullableString(json.bounty_id)
      };
    case "InsuranceCreatedEvent":
      return {
        ...baseEvent("InsuranceCreatedEvent", node, eventType),
        orderId: toNullableString(json.order_id),
        boardId: toNullableString(json.board_id),
        insuredKey: toTenantItemId(json.insured_key),
        lossFilter: toNullableNumber(json.loss_filter),
        spawnMode: toNullableNumber(json.spawn_mode),
        spawnTargetKills: toNullableNumber(json.spawn_target_kills),
        coinType: toNullableString(json.coin_type),
        expiresAtMs: toNullableNumber(json.expires_at_ms),
        note: toNullableString(json.note)
      };
    case "InsuranceFundedEvent":
      return {
        ...baseEvent("InsuranceFundedEvent", node, eventType),
        orderId: toNullableString(json.order_id),
        addedAmount: toNullableNumber(json.added_amount),
        expiresAtMs: toNullableNumber(json.expires_at_ms)
      };
    case "InsuranceTriggeredEvent":
      return {
        ...baseEvent("InsuranceTriggeredEvent", node, eventType),
        orderId: toNullableString(json.order_id),
        generatedBountyId: toNullableString(json.generated_bounty_id),
        killerKey: toTenantItemId(json.killer_key),
        killmailItemId: toNullableNumber(json.killmail_item_id),
        spawnMode: toNullableNumber(json.spawn_mode),
        spawnTargetKills: toNullableNumber(json.spawn_target_kills),
        expiresAtMs: toNullableNumber(json.expires_at_ms)
      };
    case "InsuranceClosedEvent":
      return {
        ...baseEvent("InsuranceClosedEvent", node, eventType),
        orderId: toNullableString(json.order_id)
      };
  }
}

export async function queryBountyBoardEvents(
  config: GraphQLClientConfig,
  args: QueryBountyBoardEventsArgs
): Promise<ConnectionPage<BountyBoardLifecycleEvent>> {
  const eventType = getBountyBoardEventType(args.packageId, args.eventName);
  const data = await requestGraphQL<
    BountyBoardEventsResponse,
    { eventType: string; first: number; after: string | null }
  >(config, {
    query: GET_EVENTS_BY_TYPE,
    variables: {
      eventType,
      first: args.first ?? 50,
      after: args.after ?? null
    }
  });

  const edges: ConnectionEdge<BountyBoardLifecycleEvent>[] = (data.events?.edges ?? [])
    .filter((edge): edge is GraphQLEventEdge & { cursor: string; node: GraphQLEventNode } =>
      typeof edge?.cursor === "string" && !!edge.node
    )
    .map((edge) => ({
      cursor: edge.cursor,
      node: mapLifecycleNode(args.eventName, edge.node, eventType)
    }));

  return toConnectionPage(
    edges.map((edge) => edge.node),
    mapPageInfo(data.events?.pageInfo),
    edges
  );
}
