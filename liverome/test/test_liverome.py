import json


def deploy_liverome(direct_deploy):
    return direct_deploy("contracts/liverome.py")


def mock_market(direct_vm, change_24h):
    direct_vm.mock_web(
        r".*api\.coingecko\.com.*",
        {
            "status": 200,
            "body": json.dumps(
                {"bitcoin": {"usd": 100000, "usd_24h_change": change_24h}}
            ),
        },
    )


def test_initial_state(direct_deploy):
    contract = deploy_liverome(direct_deploy)

    assert contract.get_strategy() == "balanced"
    assert contract.get_total_deposits() == 0
    assert contract.get_total_pending_withdrawals() == 0
    assert contract.get_cooldown_remaining() == 0
    assert contract.get_history() == []

    allocation = contract.get_allocation()
    assert allocation["growth_bps"] == 4500
    assert allocation["reserve_bps"] == 4000
    assert allocation["protection_bps"] == 1500
    assert allocation["total_bps"] == 10000


def test_deposit_increases_user_balance_and_total_deposits(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    contract.deposit()

    key = contract.get_last_deposit()["key"]
    assert contract.get_user_balance_key(key) == 1000
    assert contract.get_total_deposits() == 1000
    assert contract.get_accounting()["total_claims"] == 1000


def test_withdraw_preserves_claim_as_pending_until_payout(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    contract.deposit()

    direct_vm.value = 0
    contract.withdraw(400)

    key = contract.get_last_withdraw()["key"]
    assert contract.get_user_balance_key(key) == 600
    assert contract.get_user_pending_withdrawal_key(key) == 400
    assert contract.get_total_deposits() == 1000
    assert contract.get_total_pending_withdrawals() == 400
    assert contract.get_last_withdraw()["payout_requested_amount"] == 400
    assert contract.get_last_withdraw()["payout_request_count"] == 1

    accounting = contract.get_accounting()
    assert accounting["available_deposits"] == 600
    assert accounting["total_pending_withdrawals"] == 400
    assert accounting["total_claims"] == 1000


def test_mark_withdrawal_paid_reduces_total_after_successful_payout(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    contract.deposit()
    direct_vm.value = 0
    contract.withdraw(400)
    key = contract.get_last_withdraw()["key"]

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only owner"):
        contract.mark_withdrawal_paid(key, 400)

    direct_vm.sender = direct_owner
    contract.mark_withdrawal_paid(key, 400)

    assert contract.get_user_balance_key(key) == 600
    assert contract.get_user_pending_withdrawal_key(key) == 0
    assert contract.get_total_deposits() == 600
    assert contract.get_total_pending_withdrawals() == 0


def test_withdraw_more_than_available_reverts_without_state_loss(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    direct_vm.value = 100
    contract.deposit()

    direct_vm.value = 0
    with direct_vm.expect_revert("Insufficient balance"):
        contract.withdraw(500)

    key = contract.get_last_deposit()["key"]
    assert contract.get_user_balance_key(key) == 100
    assert contract.get_total_deposits() == 100
    assert contract.get_total_pending_withdrawals() == 0


def test_rebalance_changes_actual_allocation_fields(direct_vm, direct_deploy, direct_alice):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    mock_market(direct_vm, 7.79)

    contract.rebalance()

    assert contract.get_strategy() == "aggressive"
    allocation = contract.get_allocation()
    assert allocation["growth_bps"] == 7000
    assert allocation["reserve_bps"] == 2000
    assert allocation["protection_bps"] == 1000
    assert allocation["total_bps"] == 10000

    history = contract.get_history()
    assert len(history) == 1
    assert history[0]["regime"] == "bull"
    assert history[0]["new_strategy"] == "aggressive"
    assert history[0]["growth_bps"] == 7000
