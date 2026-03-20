# Architecture

## Read Path

The dapp reads chain data through `packages/frontier-client`. GraphQL request code lives in `src/graphql`, and the client now exposes two read paths:

- GraphQL event queries for killmail and bounty lifecycle feeds
- direct RPC object reads for the current `Board` registry state

Frontend configuration carries both the world package id for killmail events and the local `bounty_board` package id for business flows.

Killmail matching is intentionally split off-chain:

- `bounty_board` emits creation, funding, trigger, and close events.
- Oracle infrastructure indexes active bounty objects from those events.
- The oracle listens to `world::killmail::KillmailCreatedEvent`.
- When a killmail matches indexed bounty rules, the oracle submits a transaction with the concrete bounty object.

## Write Path

The local write surface lives in `contracts/bounty_board`. The package uses a standard `init` function to publish a shared `Board` registry and transfer an `OracleCap` to the deployer. `Board` is not a generic admin root; it holds board-level config and the active object registry so the current on-chain state can be inspected without relying only on event replay. Oracle authority is scoped to writing back verified killmail outcomes only; it is not a general admin role.

The current on-chain business objects are:

- `SingleBountyPool<T>`
- `MultiBountyPool<T>`
- `InsuranceOrder<T>`

Important constraints:

- No `dof` or on-chain search layer is used.
- `Board` acts as a small registry/config root, not as a funds container.
- Oracle calls operate on explicit shared objects instead of lookup keys.
- Single-kill and multi-kill both accumulate `claimable` balances per hunter.
- Insurance orders do not pay out directly; they trigger the creation of a normal bounty targeting the killer and inherit the remaining validity window.
- Terminal objects are deleted on-chain, and the oracle should remove them from its active index when close events are emitted.

Supported rule dimensions in V1:

- target character via `Character` / `TenantItemId`
- loss filter: `AnyLoss`, `ShipOnly`, `StructureOnly`
- mode: `SingleKill` or configurable `MultiKill`
- optional short note, capped at 64 bytes
- insurance orders that spawn a regular bounty after the insured character is killed

## Network Rules

Development targets EVE Frontier Utopia on Sui testnet only. Keep endpoints and published ids in `src/constants` and update generated values through `scripts/sync-addresses.ts`.
