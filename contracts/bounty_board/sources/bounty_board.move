#[allow(lint(custom_state_change, share_owned, self_transfer))]
module bounty_board::bounty_board;

use std::{
    ascii::String as AsciiString,
    string::{Self, String},
    type_name
};
use sui::{
    balance::{Self, Balance},
    clock::Clock,
    coin::{Self, Coin},
    event,
    vec_map::{Self, VecMap}
};
use world::{
    character::{Self, Character},
    in_game_id::TenantItemId
};

#[error(code = 0)]
const ECharacterOwnerMismatch: vector<u8> = b"Sender does not control the provided Character";
#[error(code = 1)]
const EDurationDaysOutOfRange: vector<u8> = b"Duration days must be between 7 and 365";
#[error(code = 2)]
const ELossFilterInvalid: vector<u8> = b"Loss filter is invalid";
#[error(code = 3)]
const ENoteTooLong: vector<u8> = b"Note exceeds 64 bytes";
#[error(code = 4)]
const ERewardEmpty: vector<u8> = b"Reward coin value must be greater than zero";
#[error(code = 5)]
const EBountyExpired: vector<u8> = b"Bounty has expired";
#[error(code = 6)]
const ESingleBountyAlreadySettled: vector<u8> = b"Single bounty is already settled";
#[error(code = 7)]
const ETargetKillsOutOfRange: vector<u8> = b"Target kills must be between 2 and 1000";
#[error(code = 8)]
const ERewardNotDivisible: vector<u8> = b"Reward must be divisible by target kills";
#[error(code = 9)]
const EMultiBountyInProgress: vector<u8> = b"Cannot reprice a multi bounty after kill progress has started";
#[error(code = 10)]
const EKillmailAlreadyUsed: vector<u8> = b"Killmail item id was already used for this bounty";
#[error(code = 11)]
const ENothingToClaim: vector<u8> = b"No claimable reward exists for this hunter";
#[error(code = 12)]
const ENothingToRefund: vector<u8> = b"No refundable balance exists for this contributor";
#[error(code = 13)]
const ESpawnModeInvalid: vector<u8> = b"Insurance spawn mode is invalid";
#[error(code = 14)]
const EMultiTargetReached: vector<u8> = b"Multi bounty target kills already reached";
#[error(code = 15)]
const EInsuranceExpired: vector<u8> = b"Insurance order has expired";

const LOSS_ANY: u8 = 0;
const LOSS_SHIP: u8 = 1;
const LOSS_STRUCTURE: u8 = 2;

const MODE_SINGLE: u8 = 1;
const MODE_MULTI: u8 = 2;

const MIN_DURATION_DAYS: u64 = 7;
const MAX_DURATION_DAYS: u64 = 365;
const MIN_TARGET_KILLS: u64 = 2;
const MAX_TARGET_KILLS: u64 = 1000;
const MAX_NOTE_BYTES: u64 = 64;
const MILLIS_PER_DAY: u64 = 86_400_000;

const DEFAULT_INSURANCE_NOTE: vector<u8> =
    x"e38284e38289e3828ce3819fe38289e38284e3828ae8bf94e38199e38081e5808de8bf94e38197e381a0";

public struct Board has key {
    id: UID,
}

public struct OracleCap has key, store {
    id: UID,
}

public struct SingleBountyPool<phantom T> has key, store {
    id: UID,
    board_id: ID,
    target_key: TenantItemId,
    loss_filter: u8,
    note: String,
    reward_balance: Balance<T>,
    expires_at_ms: u64,
    settled: bool,
    claimable_by_hunter: VecMap<TenantItemId, u64>,
    contributions: VecMap<TenantItemId, u64>,
    used_killmail_item_ids: vector<u64>,
}

public struct MultiBountyPool<phantom T> has key, store {
    id: UID,
    board_id: ID,
    target_key: TenantItemId,
    loss_filter: u8,
    note: String,
    reward_balance: Balance<T>,
    expires_at_ms: u64,
    target_kills: u64,
    recorded_kills: u64,
    per_kill_reward: u64,
    claimable_by_hunter: VecMap<TenantItemId, u64>,
    contributions: VecMap<TenantItemId, u64>,
    used_killmail_item_ids: vector<u64>,
}

public struct InsuranceOrder<phantom T> has key, store {
    id: UID,
    board_id: ID,
    insured_key: TenantItemId,
    loss_filter: u8,
    note: String,
    reward_balance: Balance<T>,
    expires_at_ms: u64,
    spawn_mode: u8,
    spawn_target_kills: u64,
}

public struct SingleBountyCreatedEvent has copy, drop {
    bounty_id: ID,
    board_id: ID,
    target_key: TenantItemId,
    loss_filter: u8,
    coin_type: AsciiString,
    expires_at_ms: u64,
    note: String,
}

public struct SingleBountyFundedEvent has copy, drop {
    bounty_id: ID,
    contributor_key: TenantItemId,
    added_amount: u64,
    expires_at_ms: u64,
}

public struct SingleBountySettledEvent has copy, drop {
    bounty_id: ID,
    hunter_key: TenantItemId,
    killmail_item_id: u64,
}

public struct SingleBountyClosedEvent has copy, drop {
    bounty_id: ID,
}

public struct MultiBountyCreatedEvent has copy, drop {
    bounty_id: ID,
    board_id: ID,
    target_key: TenantItemId,
    loss_filter: u8,
    target_kills: u64,
    per_kill_reward: u64,
    coin_type: AsciiString,
    expires_at_ms: u64,
    note: String,
}

public struct MultiBountyFundedEvent has copy, drop {
    bounty_id: ID,
    contributor_key: TenantItemId,
    added_amount: u64,
    expires_at_ms: u64,
    per_kill_reward: u64,
}

public struct MultiBountyKillRecordedEvent has copy, drop {
    bounty_id: ID,
    hunter_key: TenantItemId,
    killmail_item_id: u64,
    recorded_kills: u64,
}

public struct MultiBountyClosedEvent has copy, drop {
    bounty_id: ID,
}

public struct InsuranceCreatedEvent has copy, drop {
    order_id: ID,
    board_id: ID,
    insured_key: TenantItemId,
    loss_filter: u8,
    spawn_mode: u8,
    spawn_target_kills: u64,
    coin_type: AsciiString,
    expires_at_ms: u64,
    note: String,
}

public struct InsuranceFundedEvent has copy, drop {
    order_id: ID,
    added_amount: u64,
    expires_at_ms: u64,
}

public struct InsuranceTriggeredEvent has copy, drop {
    order_id: ID,
    generated_bounty_id: ID,
    killer_key: TenantItemId,
    killmail_item_id: u64,
    spawn_mode: u8,
    spawn_target_kills: u64,
    expires_at_ms: u64,
}

public struct InsuranceClosedEvent has copy, drop {
    order_id: ID,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(Board {
        id: object::new(ctx),
    });
    transfer::transfer(OracleCap {
        id: object::new(ctx),
    }, ctx.sender());
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

public fun any_loss(): u8 { LOSS_ANY }

public fun ship_only(): u8 { LOSS_SHIP }

public fun structure_only(): u8 { LOSS_STRUCTURE }

public fun spawn_single(): u8 { MODE_SINGLE }

public fun spawn_multi(): u8 { MODE_MULTI }

public fun create_single_bounty<T>(
    board: &Board,
    poster: &Character,
    target: &Character,
    reward: Coin<T>,
    duration_days: u64,
    loss_filter: u8,
    note: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(poster, ctx);
    assert_valid_duration(duration_days);
    assert_valid_loss_filter(loss_filter);
    assert_valid_note(&note);

    let reward_amount = coin::value(&reward);
    assert!(reward_amount > 0, ERewardEmpty);

    let mut contributions = vec_map::empty<TenantItemId, u64>();
    let contributor_key = character::key(poster);
    vec_map::insert(&mut contributions, contributor_key, reward_amount);

    let pool = SingleBountyPool<T> {
        id: object::new(ctx),
        board_id: object::id(board),
        target_key: character::key(target),
        loss_filter,
        note,
        reward_balance: coin::into_balance(reward),
        expires_at_ms: next_expiry(clock, duration_days),
        settled: false,
        claimable_by_hunter: vec_map::empty(),
        contributions,
        used_killmail_item_ids: vector[],
    };
    let pool_id = object::id(&pool);
    event::emit(SingleBountyCreatedEvent {
        bounty_id: pool_id,
        board_id: pool.board_id,
        target_key: pool.target_key,
        loss_filter: pool.loss_filter,
        coin_type: coin_type_name<T>(),
        expires_at_ms: pool.expires_at_ms,
        note: copy pool.note,
    });
    transfer::share_object(pool);
}

public fun fund_single_bounty<T>(
    pool: SingleBountyPool<T>,
    poster: &Character,
    reward: Coin<T>,
    duration_days: u64,
    note: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(poster, ctx);
    assert_valid_duration(duration_days);
    assert_valid_note(&note);

    let reward_amount = coin::value(&reward);
    assert!(reward_amount > 0, ERewardEmpty);

    let mut pool = pool;
    assert!(clock.timestamp_ms() < pool.expires_at_ms, EBountyExpired);
    assert!(!pool.settled, ESingleBountyAlreadySettled);

    balance::join(&mut pool.reward_balance, coin::into_balance(reward));
    pool.expires_at_ms = next_expiry(clock, duration_days);
    upsert_amount(&mut pool.contributions, character::key(poster), reward_amount);
    replace_note_if_present(&mut pool.note, note);

    event::emit(SingleBountyFundedEvent {
        bounty_id: object::id(&pool),
        contributor_key: character::key(poster),
        added_amount: reward_amount,
        expires_at_ms: pool.expires_at_ms,
    });
    transfer::share_object(pool);
}

public fun settle_single_bounty<T>(
    _: &OracleCap,
    pool: SingleBountyPool<T>,
    hunter: &Character,
    killmail_item_id: u64,
    clock: &Clock,
) {
    let mut pool = pool;
    assert!(clock.timestamp_ms() < pool.expires_at_ms, EBountyExpired);
    assert!(!pool.settled, ESingleBountyAlreadySettled);
    assert_killmail_unused(&pool.used_killmail_item_ids, killmail_item_id);

    let reward_amount = balance::value(&pool.reward_balance);
    consume_contributions(&mut pool.contributions, reward_amount);
    upsert_amount(&mut pool.claimable_by_hunter, character::key(hunter), reward_amount);
    pool.used_killmail_item_ids.push_back(killmail_item_id);
    pool.settled = true;

    event::emit(SingleBountySettledEvent {
        bounty_id: object::id(&pool),
        hunter_key: character::key(hunter),
        killmail_item_id,
    });
    transfer::share_object(pool);
}

public fun claim_single_bounty<T>(
    pool: SingleBountyPool<T>,
    hunter: &Character,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(hunter, ctx);

    let mut pool = pool;
    let claim_amount = take_amount(&mut pool.claimable_by_hunter, character::key(hunter));
    assert!(claim_amount > 0, ENothingToClaim);

    let payout = balance::split(&mut pool.reward_balance, claim_amount).into_coin(ctx);
    transfer::public_transfer(payout, ctx.sender());
    finish_single_pool_if_possible(pool);
}

public fun refund_expired_single_contribution<T>(
    pool: SingleBountyPool<T>,
    poster: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(poster, ctx);

    let mut pool = pool;
    assert!(clock.timestamp_ms() >= pool.expires_at_ms, EBountyExpired);

    let refund_amount = take_amount(&mut pool.contributions, character::key(poster));
    assert!(refund_amount > 0, ENothingToRefund);

    let refund = balance::split(&mut pool.reward_balance, refund_amount).into_coin(ctx);
    transfer::public_transfer(refund, ctx.sender());
    finish_single_pool_if_possible(pool);
}

public fun create_multi_bounty<T>(
    board: &Board,
    poster: &Character,
    target: &Character,
    reward: Coin<T>,
    duration_days: u64,
    loss_filter: u8,
    target_kills: u64,
    note: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(poster, ctx);
    assert_valid_duration(duration_days);
    assert_valid_loss_filter(loss_filter);
    assert_valid_target_kills(target_kills);
    assert_valid_note(&note);

    let reward_amount = coin::value(&reward);
    assert!(reward_amount > 0, ERewardEmpty);
    assert!(reward_amount % target_kills == 0, ERewardNotDivisible);

    let mut contributions = vec_map::empty<TenantItemId, u64>();
    let contributor_key = character::key(poster);
    vec_map::insert(&mut contributions, contributor_key, reward_amount);

    let pool = MultiBountyPool<T> {
        id: object::new(ctx),
        board_id: object::id(board),
        target_key: character::key(target),
        loss_filter,
        note,
        reward_balance: coin::into_balance(reward),
        expires_at_ms: next_expiry(clock, duration_days),
        target_kills,
        recorded_kills: 0,
        per_kill_reward: reward_amount / target_kills,
        claimable_by_hunter: vec_map::empty(),
        contributions,
        used_killmail_item_ids: vector[],
    };
    event::emit(MultiBountyCreatedEvent {
        bounty_id: object::id(&pool),
        board_id: pool.board_id,
        target_key: pool.target_key,
        loss_filter: pool.loss_filter,
        target_kills: pool.target_kills,
        per_kill_reward: pool.per_kill_reward,
        coin_type: coin_type_name<T>(),
        expires_at_ms: pool.expires_at_ms,
        note: copy pool.note,
    });
    transfer::share_object(pool);
}

public fun fund_multi_bounty<T>(
    pool: MultiBountyPool<T>,
    poster: &Character,
    reward: Coin<T>,
    duration_days: u64,
    note: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(poster, ctx);
    assert_valid_duration(duration_days);
    assert_valid_note(&note);

    let reward_amount = coin::value(&reward);
    assert!(reward_amount > 0, ERewardEmpty);

    let mut pool = pool;
    assert!(clock.timestamp_ms() < pool.expires_at_ms, EBountyExpired);
    assert!(pool.recorded_kills == 0, EMultiBountyInProgress);

    balance::join(&mut pool.reward_balance, coin::into_balance(reward));
    upsert_amount(&mut pool.contributions, character::key(poster), reward_amount);
    pool.expires_at_ms = next_expiry(clock, duration_days);

    let total_reward = balance::value(&pool.reward_balance);
    assert!(total_reward % pool.target_kills == 0, ERewardNotDivisible);
    pool.per_kill_reward = total_reward / pool.target_kills;
    replace_note_if_present(&mut pool.note, note);

    event::emit(MultiBountyFundedEvent {
        bounty_id: object::id(&pool),
        contributor_key: character::key(poster),
        added_amount: reward_amount,
        expires_at_ms: pool.expires_at_ms,
        per_kill_reward: pool.per_kill_reward,
    });
    transfer::share_object(pool);
}

public fun record_multi_kill<T>(
    _: &OracleCap,
    pool: MultiBountyPool<T>,
    hunter: &Character,
    killmail_item_id: u64,
    clock: &Clock,
) {
    let mut pool = pool;
    assert!(clock.timestamp_ms() < pool.expires_at_ms, EBountyExpired);
    assert!(pool.recorded_kills < pool.target_kills, EMultiTargetReached);
    assert_killmail_unused(&pool.used_killmail_item_ids, killmail_item_id);

    let per_kill_reward = pool.per_kill_reward;
    let hunter_key = character::key(hunter);
    consume_contributions(&mut pool.contributions, per_kill_reward);
    upsert_amount(&mut pool.claimable_by_hunter, hunter_key, per_kill_reward);
    pool.used_killmail_item_ids.push_back(killmail_item_id);
    pool.recorded_kills = pool.recorded_kills + 1;

    event::emit(MultiBountyKillRecordedEvent {
        bounty_id: object::id(&pool),
        hunter_key,
        killmail_item_id,
        recorded_kills: pool.recorded_kills,
    });
    transfer::share_object(pool);
}

public fun claim_multi_bounty<T>(
    pool: MultiBountyPool<T>,
    hunter: &Character,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(hunter, ctx);

    let mut pool = pool;
    let claim_amount = take_amount(&mut pool.claimable_by_hunter, character::key(hunter));
    assert!(claim_amount > 0, ENothingToClaim);

    let payout = balance::split(&mut pool.reward_balance, claim_amount).into_coin(ctx);
    transfer::public_transfer(payout, ctx.sender());
    finish_multi_pool_if_possible(pool);
}

public fun refund_expired_multi_contribution<T>(
    pool: MultiBountyPool<T>,
    poster: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(poster, ctx);

    let mut pool = pool;
    assert!(clock.timestamp_ms() >= pool.expires_at_ms, EBountyExpired);

    let refund_amount = take_amount(&mut pool.contributions, character::key(poster));
    assert!(refund_amount > 0, ENothingToRefund);

    let refund = balance::split(&mut pool.reward_balance, refund_amount).into_coin(ctx);
    transfer::public_transfer(refund, ctx.sender());
    finish_multi_pool_if_possible(pool);
}

public fun create_insurance_order<T>(
    board: &Board,
    insured: &Character,
    reward: Coin<T>,
    duration_days: u64,
    loss_filter: u8,
    spawn_mode: u8,
    spawn_target_kills: u64,
    note: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(insured, ctx);
    assert_valid_duration(duration_days);
    assert_valid_loss_filter(loss_filter);
    assert_valid_spawn_mode(spawn_mode, spawn_target_kills);

    let note = normalize_insurance_note(note);
    assert_valid_note(&note);

    let reward_amount = coin::value(&reward);
    assert!(reward_amount > 0, ERewardEmpty);
    if (spawn_mode == MODE_MULTI) {
        assert!(reward_amount % spawn_target_kills == 0, ERewardNotDivisible);
    };

    let order = InsuranceOrder<T> {
        id: object::new(ctx),
        board_id: object::id(board),
        insured_key: character::key(insured),
        loss_filter,
        note,
        reward_balance: coin::into_balance(reward),
        expires_at_ms: next_expiry(clock, duration_days),
        spawn_mode,
        spawn_target_kills,
    };
    event::emit(InsuranceCreatedEvent {
        order_id: object::id(&order),
        board_id: order.board_id,
        insured_key: order.insured_key,
        loss_filter: order.loss_filter,
        spawn_mode: order.spawn_mode,
        spawn_target_kills: order.spawn_target_kills,
        coin_type: coin_type_name<T>(),
        expires_at_ms: order.expires_at_ms,
        note: copy order.note,
    });
    transfer::share_object(order);
}

public fun fund_insurance_order<T>(
    order: InsuranceOrder<T>,
    insured: &Character,
    reward: Coin<T>,
    duration_days: u64,
    note: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(insured, ctx);
    assert_valid_duration(duration_days);
    assert_valid_note(&note);

    let reward_amount = coin::value(&reward);
    assert!(reward_amount > 0, ERewardEmpty);

    let mut order = order;
    assert!(clock.timestamp_ms() < order.expires_at_ms, EInsuranceExpired);

    balance::join(&mut order.reward_balance, coin::into_balance(reward));
    order.expires_at_ms = next_expiry(clock, duration_days);
    if (order.spawn_mode == MODE_MULTI) {
        let total_reward = balance::value(&order.reward_balance);
        assert!(total_reward % order.spawn_target_kills == 0, ERewardNotDivisible);
    };
    replace_note_if_present(&mut order.note, note);

    event::emit(InsuranceFundedEvent {
        order_id: object::id(&order),
        added_amount: reward_amount,
        expires_at_ms: order.expires_at_ms,
    });
    transfer::share_object(order);
}

public fun trigger_insurance_order<T>(
    _: &OracleCap,
    order: InsuranceOrder<T>,
    killer: &Character,
    killmail_item_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let mut order = order;
    assert!(clock.timestamp_ms() < order.expires_at_ms, EInsuranceExpired);

    let generated_bounty_id = if (order.spawn_mode == MODE_SINGLE) {
        spawn_single_from_insurance(&mut order, killer, killmail_item_id, ctx)
    } else {
        spawn_multi_from_insurance(&mut order, killer, killmail_item_id, ctx)
    };

    event::emit(InsuranceTriggeredEvent {
        order_id: object::id(&order),
        generated_bounty_id,
        killer_key: character::key(killer),
        killmail_item_id,
        spawn_mode: order.spawn_mode,
        spawn_target_kills: order.spawn_target_kills,
        expires_at_ms: order.expires_at_ms,
    });
    event::emit(InsuranceClosedEvent {
        order_id: object::id(&order),
    });
    destroy_insurance_order(order);
}

public fun refund_expired_insurance<T>(
    order: InsuranceOrder<T>,
    insured: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_sender_controls_character(insured, ctx);
    assert!(clock.timestamp_ms() >= order.expires_at_ms, EInsuranceExpired);

    let mut order = order;
    let refund_amount = balance::value(&order.reward_balance);
    assert!(refund_amount > 0, ENothingToRefund);

    let refund = balance::withdraw_all(&mut order.reward_balance).into_coin(ctx);
    transfer::public_transfer(refund, ctx.sender());
    event::emit(InsuranceClosedEvent {
        order_id: object::id(&order),
    });
    destroy_insurance_order(order);
}

public fun single_claimable_amount<T>(
    pool: &SingleBountyPool<T>,
    hunter: &Character,
): u64 {
    amount_or_zero(&pool.claimable_by_hunter, character::key(hunter))
}

public fun multi_claimable_amount<T>(
    pool: &MultiBountyPool<T>,
    hunter: &Character,
): u64 {
    amount_or_zero(&pool.claimable_by_hunter, character::key(hunter))
}

public fun multi_recorded_kills<T>(pool: &MultiBountyPool<T>): u64 {
    pool.recorded_kills
}

public fun insurance_note_length<T>(order: &InsuranceOrder<T>): u64 {
    string::length(&order.note)
}

fun spawn_single_from_insurance<T>(
    order: &mut InsuranceOrder<T>,
    killer: &Character,
    killmail_item_id: u64,
    ctx: &mut TxContext,
): ID {
    let reward_amount = balance::value(&order.reward_balance);
    let mut contributions = vec_map::empty<TenantItemId, u64>();
    vec_map::insert(&mut contributions, order.insured_key, reward_amount);

    let pool = SingleBountyPool<T> {
        id: object::new(ctx),
        board_id: order.board_id,
        target_key: character::key(killer),
        loss_filter: order.loss_filter,
        note: copy order.note,
        reward_balance: balance::split(&mut order.reward_balance, reward_amount),
        expires_at_ms: order.expires_at_ms,
        settled: false,
        claimable_by_hunter: vec_map::empty(),
        contributions,
        used_killmail_item_ids: vector[killmail_item_id],
    };
    let pool_id = object::id(&pool);
    event::emit(SingleBountyCreatedEvent {
        bounty_id: pool_id,
        board_id: pool.board_id,
        target_key: pool.target_key,
        loss_filter: pool.loss_filter,
        coin_type: coin_type_name<T>(),
        expires_at_ms: pool.expires_at_ms,
        note: copy pool.note,
    });
    transfer::share_object(pool);
    pool_id
}

fun spawn_multi_from_insurance<T>(
    order: &mut InsuranceOrder<T>,
    killer: &Character,
    killmail_item_id: u64,
    ctx: &mut TxContext,
): ID {
    let reward_amount = balance::value(&order.reward_balance);
    assert!(reward_amount % order.spawn_target_kills == 0, ERewardNotDivisible);

    let mut contributions = vec_map::empty<TenantItemId, u64>();
    vec_map::insert(&mut contributions, order.insured_key, reward_amount);

    let pool = MultiBountyPool<T> {
        id: object::new(ctx),
        board_id: order.board_id,
        target_key: character::key(killer),
        loss_filter: order.loss_filter,
        note: copy order.note,
        reward_balance: balance::split(&mut order.reward_balance, reward_amount),
        expires_at_ms: order.expires_at_ms,
        target_kills: order.spawn_target_kills,
        recorded_kills: 0,
        per_kill_reward: reward_amount / order.spawn_target_kills,
        claimable_by_hunter: vec_map::empty(),
        contributions,
        used_killmail_item_ids: vector[killmail_item_id],
    };
    let pool_id = object::id(&pool);
    event::emit(MultiBountyCreatedEvent {
        bounty_id: pool_id,
        board_id: pool.board_id,
        target_key: pool.target_key,
        loss_filter: pool.loss_filter,
        target_kills: pool.target_kills,
        per_kill_reward: pool.per_kill_reward,
        coin_type: coin_type_name<T>(),
        expires_at_ms: pool.expires_at_ms,
        note: copy pool.note,
    });
    transfer::share_object(pool);
    pool_id
}

fun finish_single_pool_if_possible<T>(pool: SingleBountyPool<T>) {
    if (can_destroy_single_pool(&pool)) {
        event::emit(SingleBountyClosedEvent {
            bounty_id: object::id(&pool),
        });
        destroy_single_pool(pool);
    } else {
        transfer::share_object(pool);
    }
}

fun finish_multi_pool_if_possible<T>(pool: MultiBountyPool<T>) {
    if (can_destroy_multi_pool(&pool)) {
        event::emit(MultiBountyClosedEvent {
            bounty_id: object::id(&pool),
        });
        destroy_multi_pool(pool);
    } else {
        transfer::share_object(pool);
    }
}

fun can_destroy_single_pool<T>(pool: &SingleBountyPool<T>): bool {
    balance::value(&pool.reward_balance) == 0 &&
        vec_map::is_empty(&pool.claimable_by_hunter) &&
        vec_map::is_empty(&pool.contributions)
}

fun can_destroy_multi_pool<T>(pool: &MultiBountyPool<T>): bool {
    balance::value(&pool.reward_balance) == 0 &&
        vec_map::is_empty(&pool.claimable_by_hunter) &&
        vec_map::is_empty(&pool.contributions)
}

fun destroy_single_pool<T>(pool: SingleBountyPool<T>) {
    let SingleBountyPool {
        id,
        board_id: _,
        target_key: _,
        loss_filter: _,
        note: _,
        reward_balance,
        expires_at_ms: _,
        settled: _,
        claimable_by_hunter,
        contributions,
        used_killmail_item_ids: _,
    } = pool;
    balance::destroy_zero(reward_balance);
    vec_map::destroy_empty(claimable_by_hunter);
    vec_map::destroy_empty(contributions);
    id.delete();
}

fun destroy_multi_pool<T>(pool: MultiBountyPool<T>) {
    let MultiBountyPool {
        id,
        board_id: _,
        target_key: _,
        loss_filter: _,
        note: _,
        reward_balance,
        expires_at_ms: _,
        target_kills: _,
        recorded_kills: _,
        per_kill_reward: _,
        claimable_by_hunter,
        contributions,
        used_killmail_item_ids: _,
    } = pool;
    balance::destroy_zero(reward_balance);
    vec_map::destroy_empty(claimable_by_hunter);
    vec_map::destroy_empty(contributions);
    id.delete();
}

fun destroy_insurance_order<T>(order: InsuranceOrder<T>) {
    let InsuranceOrder {
        id,
        board_id: _,
        insured_key: _,
        loss_filter: _,
        note: _,
        reward_balance,
        expires_at_ms: _,
        spawn_mode: _,
        spawn_target_kills: _,
    } = order;
    balance::destroy_zero(reward_balance);
    id.delete();
}

fun assert_sender_controls_character(character: &Character, ctx: &TxContext) {
    assert!(character::character_address(character) == ctx.sender(), ECharacterOwnerMismatch);
}

fun assert_valid_duration(duration_days: u64) {
    assert!(
        duration_days >= MIN_DURATION_DAYS && duration_days <= MAX_DURATION_DAYS,
        EDurationDaysOutOfRange,
    );
}

fun assert_valid_loss_filter(loss_filter: u8) {
    assert!(
        loss_filter == LOSS_ANY || loss_filter == LOSS_SHIP || loss_filter == LOSS_STRUCTURE,
        ELossFilterInvalid,
    );
}

fun assert_valid_target_kills(target_kills: u64) {
    assert!(
        target_kills >= MIN_TARGET_KILLS && target_kills <= MAX_TARGET_KILLS,
        ETargetKillsOutOfRange,
    );
}

fun assert_valid_spawn_mode(spawn_mode: u8, spawn_target_kills: u64) {
    assert!(spawn_mode == MODE_SINGLE || spawn_mode == MODE_MULTI, ESpawnModeInvalid);
    if (spawn_mode == MODE_MULTI) {
        assert_valid_target_kills(spawn_target_kills);
    } else {
        assert!(spawn_target_kills == 0, ESpawnModeInvalid);
    };
}

fun assert_valid_note(note: &String) {
    assert!(string::length(note) <= MAX_NOTE_BYTES, ENoteTooLong);
}

fun next_expiry(clock: &Clock, duration_days: u64): u64 {
    clock.timestamp_ms() + duration_days * MILLIS_PER_DAY
}

fun normalize_insurance_note(note: String): String {
    if (string::is_empty(&note)) string::utf8(DEFAULT_INSURANCE_NOTE) else note
}

fun replace_note_if_present(current: &mut String, next: String) {
    if (!string::is_empty(&next)) {
        *current = next;
    };
}

fun coin_type_name<T>(): AsciiString {
    type_name::with_defining_ids<T>().into_string()
}

fun upsert_amount(map: &mut VecMap<TenantItemId, u64>, key: TenantItemId, amount: u64) {
    if (vec_map::contains(map, &key)) {
        let current = vec_map::get_mut(map, &key);
        *current = *current + amount;
    } else {
        vec_map::insert(map, key, amount);
    };
}

fun take_amount(map: &mut VecMap<TenantItemId, u64>, key: TenantItemId): u64 {
    if (!vec_map::contains(map, &key)) return 0;
    let (_, amount) = vec_map::remove(map, &key);
    amount
}

fun amount_or_zero(map: &VecMap<TenantItemId, u64>, key: TenantItemId): u64 {
    if (vec_map::contains(map, &key)) *vec_map::get(map, &key) else 0
}

fun assert_killmail_unused(used_ids: &vector<u64>, killmail_item_id: u64) {
    let len = vector::length(used_ids);
    let mut i = 0;
    while (i < len) {
        assert!(*vector::borrow(used_ids, i) != killmail_item_id, EKillmailAlreadyUsed);
        i = i + 1;
    };
}

fun sum_amounts(map: &VecMap<TenantItemId, u64>): u64 {
    let mut total = 0;
    let len = vec_map::length(map);
    let mut i = 0;
    while (i < len) {
        let (_, value) = vec_map::get_entry_by_idx(map, i);
        total = total + *value;
        i = i + 1;
    };
    total
}

fun consume_contributions(map: &mut VecMap<TenantItemId, u64>, amount: u64) {
    let total = sum_amounts(map);
    assert!(total >= amount, ENothingToRefund);

    let len = vec_map::length(map);
    let mut deducted = 0;
    let mut i = 0;
    while (i < len) {
        let (_, value) = vec_map::get_entry_by_idx_mut(map, i);
        let current = *value;
        let deduction = if (i + 1 == len) amount - deducted else (current * amount) / total;
        *value = current - deduction;
        deducted = deducted + deduction;
        i = i + 1;
    };
    prune_zero_amounts(map);
}

fun prune_zero_amounts(map: &mut VecMap<TenantItemId, u64>) {
    let mut i = vec_map::length(map);
    while (i > 0) {
        let idx = i - 1;
        let (_, value) = vec_map::get_entry_by_idx(map, idx);
        if (*value == 0) {
            let (_, _) = vec_map::remove_entry_by_idx(map, idx);
        };
        i = idx;
    };
}
