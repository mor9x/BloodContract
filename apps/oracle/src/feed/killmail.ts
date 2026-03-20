import { queryKillmailEvents, type GraphQLClientConfig, type KillmailEvent } from "@bounty-board/frontier-client";
import type { OracleConfig } from "../types";

export type KillmailEdge = {
  cursor: string;
  event: KillmailEvent;
};

export async function fetchKillmailEdges(
  config: OracleConfig,
  clientConfig: GraphQLClientConfig,
  cursor: string | null
): Promise<KillmailEdge[]> {
  const page = await queryKillmailEvents(clientConfig, {
    packageId: config.worldPackageId,
    first: config.graphQLPageSize,
    after: cursor
  });

  return page.edges.map((edge) => ({
    cursor: edge.cursor,
    event: edge.node
  }));
}
