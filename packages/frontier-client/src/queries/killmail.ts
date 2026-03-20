import { requestGraphQL, type GraphQLClientConfig } from "../graphql/client";
import { GET_KILLMAIL_CREATED_EVENTS } from "../graphql/documents/killmail";
import { toConnectionPage } from "../graphql/pagination";
import type { ConnectionPage, PageInfo } from "../types/graphql";
import type { KillmailEvent } from "../types/killmail";

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

function mapKillmailEvent(node: KillmailEventNode): KillmailEvent {
  return {
    eventType: node.eventType ?? "",
    timestamp: node.timestamp ?? null,
    digest: node.transactionBlock?.digest ?? null,
    contentsJson: node.contents?.json ?? {}
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
