import { describe, expect, test } from "bun:test";
import { nextCursor, toConnectionPage } from "../src/graphql/pagination";
import { getKillmailCreatedEventType, queryKillmailEvents } from "../src/queries/killmail";

describe("frontier-client", () => {
  test("returns the next cursor only when another page exists", () => {
    expect(nextCursor(toConnectionPage([{ id: "1" }], { hasNextPage: true, endCursor: "cursor-1" }))).toBe("cursor-1");
    expect(nextCursor(toConnectionPage([{ id: "1" }], { hasNextPage: false, endCursor: "cursor-1" }))).toBeNull();
  });

  test("builds the killmail created event type from a package id", () => {
    expect(getKillmailCreatedEventType("0xpackage")).toBe("0xpackage::killmail::KillmailCreatedEvent");
  });

  test("maps killmail event fields out of GraphQL contents json", async () => {
    const data = await queryKillmailEvents(
      {
        endpoint: "https://example.com/graphql",
        fetch: async () =>
          new Response(
            JSON.stringify({
              data: {
                events: {
                  nodes: [
                    {
                      eventType: "0xworld::killmail::KillmailCreatedEvent",
                      timestamp: "2026-03-20T00:00:00Z",
                      contents: {
                        json: {
                          key: { item_id: "7001", tenant: "UTOPIA" },
                          killer_id: { item_id: "11", tenant: "UTOPIA" },
                          victim_id: { item_id: "22", tenant: "UTOPIA" },
                          reported_by_character_id: { item_id: "33", tenant: "UTOPIA" },
                          solar_system_id: { item_id: "44", tenant: "UTOPIA" },
                          loss_type: "SHIP",
                          kill_timestamp: "1710892800"
                        }
                      },
                      transactionBlock: {
                        digest: "0xdigest"
                      }
                    }
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: null
                  }
                }
              }
            })
          )
      },
      {
        packageId: "0xworld",
        first: 1
      }
    );

    expect(data.nodes[0]).toEqual({
      eventType: "0xworld::killmail::KillmailCreatedEvent",
      timestamp: "2026-03-20T00:00:00Z",
      digest: "0xdigest",
      killmailItemId: 7001,
      killerId: { itemId: 11, tenant: "UTOPIA" },
      victimId: { itemId: 22, tenant: "UTOPIA" },
      reportedByCharacterId: { itemId: 33, tenant: "UTOPIA" },
      solarSystemId: { itemId: 44, tenant: "UTOPIA" },
      lossType: "SHIP",
      killTimestamp: 1710892800,
      contentsJson: {
        key: { item_id: "7001", tenant: "UTOPIA" },
        killer_id: { item_id: "11", tenant: "UTOPIA" },
        victim_id: { item_id: "22", tenant: "UTOPIA" },
        reported_by_character_id: { item_id: "33", tenant: "UTOPIA" },
        solar_system_id: { item_id: "44", tenant: "UTOPIA" },
        loss_type: "SHIP",
        kill_timestamp: "1710892800"
      }
    });
  });
});
