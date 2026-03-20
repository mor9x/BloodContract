# world-contracts Killmail Notes

This repository keeps the killmail-related read path from the EVE Frontier integration surface while leaving local business logic in the `bounty_board` package.

## Local Reference

Relevant source files from the local `world-contracts` checkout:

- `contracts/world/sources/killmail/killmail.move`
- `contracts/world/sources/registry/killmail_registry.move`
- `contracts/world/tests/killmail/killmail_tests.move`

## What This Repo Uses From World

- module name: `killmail`
- event name: `KillmailCreatedEvent`
- event-driven query flow for frontend reads
- `loss_type`, `killer_id`, `victim_id`, `kill_timestamp`, and `solar_system_id` as the killmail fields currently exposed to the dapp
- `Character` objects as the identity anchor for local bounty state
- `TenantItemId` values copied from `Character` objects into local bounty records
- Utopia / testnet-only assumptions

## What This Repo Intentionally Does Not Copy Yet

- `KillmailRegistry`
- direct on-chain killmail validation
- ship or structure type-specific matching
- value-based filtering
- extra builder / bounty extension scripts

## Why

The current goal is a real GraphQL event query path for killmail data and a separate local `bounty_board` business package that can:

- escrow token rewards
- assign claimable balances after oracle verification
- support single-kill, multi-kill, and insurance-triggered bounty flows
- delete terminal bounty objects cleanly without adding an on-chain lookup registry
