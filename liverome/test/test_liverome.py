import json


def deploy_liverome(direct_deploy):
    return direct_deploy("contracts/liverome.py")


def test_initial_state(direct_deploy):
    contract = deploy_liverome(direct_deploy)

    assert contract.get_strategy() == "balanced"
    assert contract.get_total_deposits() == 0
    assert contract.get_cooldown_remaining() == 0
    assert contract.get_history() == []


def test_deposit_and_withdraw(direct_vm, direct_deploy, direct_alice):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    contract.deposit()

    assert contract.get_user_balance(direct_alice) == 1000
    assert contract.get_total_deposits() == 1000

    direct_vm.value = 0
    contract.withdraw(400)

    assert contract.get_user_balance(direct_alice) == 600
    assert contract.get_total_deposits() == 600


def test_withdraw_more_than_balance_reverts(direct_vm, direct_deploy, direct_alice):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    direct_vm.value = 100
    contract.deposit()

    direct_vm.value = 0
    with direct_vm.expect_revert("Insufficient balance"):
        contract.withdraw(500)

    assert contract.get_user_balance(direct_alice) == 100
    assert contract.get_total_deposits() == 100


def test_parse_decision_rejects_inconsistent_strategy(direct_deploy):
    contract = deploy_liverome(direct_deploy)

    bad_decision = json.dumps(
        {
            "regime": "bear",
            "strategy": "aggressive",
            "reasoning": "bad risk match",
            "confidence": 99,
        }
    )

    try:
        contract._parse_decision(bad_decision)
        assert False, "expected inconsistent strategy to fail"
    except Exception as err:
        assert "Strategy does not match regime" in str(err)


def test_rebalance_updates_history_with_mocks(direct_vm, direct_deploy, direct_alice):
    contract = deploy_liverome(direct_deploy)

    direct_vm.sender = direct_alice
    direct_vm.warp("2026-08-20T00:00:00Z")
    direct_vm.mock_web(r".*api\.llama\.fi.*", {"status": 200, "body": "stable defi tvl"})
    direct_vm.mock_web(r".*api\.coingecko\.com.*", {"status": 200, "body": "btc eth green"})
    direct_vm.mock_web(r".*coindesk\.com.*", {"status": 200, "body": "constructive market news"})
    direct_vm.mock_llm(
        r".*autonomous risk engine.*",
        json.dumps(
            {
                "regime": "bull",
                "strategy": "aggressive",
                "reasoning": "Market data supports a healthy risk-on regime.",
                "confidence": 82,
            }
        ),
    )

    contract.rebalance()

    assert contract.get_strategy() == "aggressive"
    history = contract.get_history()
    assert len(history) == 1
    assert history[0]["old_strategy"] == "balanced"
    assert history[0]["new_strategy"] == "aggressive"
    assert history[0]["regime"] == "bull"
    assert history[0]["confidence"] == 82

    with direct_vm.expect_revert("Cooldown active"):
        contract.rebalance()
