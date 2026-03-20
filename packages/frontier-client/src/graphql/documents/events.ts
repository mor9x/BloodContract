export const GET_EVENTS_BY_TYPE = /* GraphQL */ `
  query GetEventsByType($eventType: String!, $first: Int, $after: String) {
    events(filter: { type: $eventType }, first: $first, after: $after) {
      edges {
        cursor
        node {
          timestamp
          contents {
            json
          }
          transaction {
            digest
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
