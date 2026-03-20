export const GET_KILLMAIL_CREATED_EVENTS = /* GraphQL */ `
  query GetKillmailCreatedEvents($eventType: String!, $first: Int, $after: String) {
    events(filter: { eventType: $eventType }, first: $first, after: $after) {
      nodes {
        eventType
        timestamp
        contents {
          json
        }
        transactionBlock {
          digest
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
