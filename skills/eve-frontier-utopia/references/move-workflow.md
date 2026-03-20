# Move Workflow

Use this file when editing `contracts/bounty_board`.

## Development Rules

- Keep the Move package scoped to the local `bounty_board` business logic; do not duplicate the world killmail module locally.
- Model kill verification as oracle-fed writeback using `OracleCap`, not as direct on-chain event inspection.
- Keep `SingleKill`, `MultiKill`, and insurance-order flows aligned around shared claimable accounting.
- Prefer explicit shared objects and lifecycle events over `dof` or on-chain lookup registries.
- Avoid adding compatibility branches or speculative abstractions to the first implementation.

## Workflow

1. Change the Move module and its tests together.
2. Run `sui move test` inside `contracts/bounty_board`.
3. Publish to Utopia testnet when ready.
4. Update generated ids with `bun run sync:addresses`.
5. Review affected killmail query assumptions and UI copy.

## Useful Commands

```bash
cd contracts/bounty_board
sui move test
sui client publish --gas-budget <budget>
```
