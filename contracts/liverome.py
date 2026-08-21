# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json

ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"
ERROR_TRANSIENT = "[TRANSIENT]"

COINGECKO_URL = (
    "https://api.coingecko.com/api/v3/simple/price"
    "?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
)

BPS_TOTAL = u256(10000)


class Liverome(gl.Contract):
    owner: Address

    total_deposits: u256
    total_pending_withdrawals: u256
    balances: TreeMap[str, u256]
    pending_withdrawals: TreeMap[str, u256]

    current_strategy: str
    last_rebalance_regime: str
    last_rebalance_reasoning: str
    last_rebalance_confidence: u256
    rebalance_count: u256

    growth_allocation_bps: u256
    reserve_allocation_bps: u256
    protection_allocation_bps: u256

    last_deposit_sender: Address
    last_deposit_key: str
    last_deposit_value: u256
    last_deposit_balance: u256
    deposit_count: u256

    last_withdraw_sender: Address
    last_withdraw_key: str
    last_withdraw_amount: u256
    last_withdraw_balance: u256
    last_withdraw_pending: u256
    last_payout_requested_sender: Address
    last_payout_requested_amount: u256
    payout_request_count: u256
    withdraw_count: u256

    def __init__(self):
        sender = gl.message.sender_address
        key = str(sender)

        self.owner = sender

        self.total_deposits = u256(0)
        self.total_pending_withdrawals = u256(0)

        self.current_strategy = "balanced"
        self.last_rebalance_regime = "sideways"
        self.last_rebalance_reasoning = "Initial state."
        self.last_rebalance_confidence = u256(0)
        self.rebalance_count = u256(0)
        self._apply_strategy_allocation("balanced")

        self.last_deposit_sender = sender
        self.last_deposit_key = key
        self.last_deposit_value = u256(0)
        self.last_deposit_balance = u256(0)
        self.deposit_count = u256(0)

        self.last_withdraw_sender = sender
        self.last_withdraw_key = key
        self.last_withdraw_amount = u256(0)
        self.last_withdraw_balance = u256(0)
        self.last_withdraw_pending = u256(0)
        self.last_payout_requested_sender = sender
        self.last_payout_requested_amount = u256(0)
        self.payout_request_count = u256(0)
        self.withdraw_count = u256(0)

    @gl.public.write.payable
    def deposit(self) -> None:
        value = u256(gl.message.value)
        if value <= u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Deposit amount must be greater than zero")

        sender = gl.message.sender_address
        key = str(sender)
        current = self.balances.get(key, u256(0))
        new_balance = current + value

        self.balances[key] = new_balance
        self.total_deposits = self.total_deposits + value
        self.last_deposit_sender = sender
        self.last_deposit_key = key
        self.last_deposit_value = value
        self.last_deposit_balance = new_balance
        self.deposit_count = self.deposit_count + u256(1)

    @gl.public.write
    def withdraw(self, amount: u256) -> None:
        if amount <= u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Withdraw amount must be greater than zero")

        sender = gl.message.sender_address
        key = str(sender)
        current = self.balances.get(key, u256(0))
        if amount > current:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Insufficient balance")

        new_balance = current - amount
        current_pending = self.pending_withdrawals.get(key, u256(0))
        new_pending = current_pending + amount

        self.balances[key] = new_balance
        self.pending_withdrawals[key] = new_pending
        self.total_pending_withdrawals = self.total_pending_withdrawals + amount
        gl.get_contract_at(sender).emit_transfer(value=amount, on="finalized")

        self.last_withdraw_sender = sender
        self.last_withdraw_key = key
        self.last_withdraw_amount = amount
        self.last_withdraw_balance = new_balance
        self.last_withdraw_pending = new_pending
        self.last_payout_requested_sender = sender
        self.last_payout_requested_amount = amount
        self.payout_request_count = self.payout_request_count + u256(1)
        self.withdraw_count = self.withdraw_count + u256(1)

    @gl.public.write
    def mark_withdrawal_paid(self, user: str, amount: u256) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only owner can mark payouts")
        if amount <= u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Payout amount must be greater than zero")

        pending = self.pending_withdrawals.get(user, u256(0))
        if amount > pending:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Pending withdrawal is too small")

        self.pending_withdrawals[user] = pending - amount
        self.total_pending_withdrawals = self.total_pending_withdrawals - amount
        self.total_deposits = self.total_deposits - amount

    @gl.public.write
    def rebalance(self) -> None:
        decision = self._consensus_market_decision()
        strategy = str(decision["strategy"])

        self.current_strategy = strategy
        self.last_rebalance_regime = str(decision["regime"])
        self.last_rebalance_reasoning = str(decision["reasoning"])[:300]
        self.last_rebalance_confidence = u256(int(decision["confidence"]))
        self._apply_strategy_allocation(strategy)
        self.rebalance_count = self.rebalance_count + u256(1)

    @gl.public.view
    def get_strategy(self) -> str:
        return self.current_strategy

    @gl.public.view
    def get_allocation(self) -> dict:
        return {
            "strategy": self.current_strategy,
            "growth_bps": int(self.growth_allocation_bps),
            "reserve_bps": int(self.reserve_allocation_bps),
            "protection_bps": int(self.protection_allocation_bps),
            "total_bps": int(
                self.growth_allocation_bps
                + self.reserve_allocation_bps
                + self.protection_allocation_bps
            ),
        }

    @gl.public.view
    def get_history(self) -> list[dict]:
        if self.rebalance_count == u256(0):
            return []
        allocation = self.get_allocation()
        return [
            {
                "strategy": self.current_strategy,
                "new_strategy": self.current_strategy,
                "old_strategy": "balanced",
                "regime": self.last_rebalance_regime,
                "reasoning": self.last_rebalance_reasoning,
                "confidence": int(self.last_rebalance_confidence),
                "rebalance_count": int(self.rebalance_count),
                "growth_bps": allocation["growth_bps"],
                "reserve_bps": allocation["reserve_bps"],
                "protection_bps": allocation["protection_bps"],
                "timestamp": str(int(self.rebalance_count)),
            }
        ]

    @gl.public.view
    def get_user_balance(self, user: Address) -> u256:
        return self.balances.get(str(user), u256(0))

    @gl.public.view
    def get_user_balance_key(self, user: str) -> u256:
        return self.balances.get(user, u256(0))

    @gl.public.view
    def get_user_pending_withdrawal_key(self, user: str) -> u256:
        return self.pending_withdrawals.get(user, u256(0))

    @gl.public.view
    def get_my_balance(self) -> u256:
        return self.balances.get(str(gl.message.sender_address), u256(0))

    @gl.public.view
    def get_my_pending_withdrawal(self) -> u256:
        return self.pending_withdrawals.get(str(gl.message.sender_address), u256(0))

    @gl.public.view
    def get_accounting(self) -> dict:
        return {
            "available_deposits": int(self.total_deposits - self.total_pending_withdrawals),
            "total_deposits": int(self.total_deposits),
            "total_pending_withdrawals": int(self.total_pending_withdrawals),
            "total_claims": int(self.total_deposits),
        }

    @gl.public.view
    def get_last_deposit_balance(self) -> u256:
        return self.last_deposit_balance

    @gl.public.view
    def get_last_deposit(self) -> dict:
        return {
            "sender": str(self.last_deposit_sender),
            "key": self.last_deposit_key,
            "value": int(self.last_deposit_value),
            "balance": int(self.last_deposit_balance),
            "count": int(self.deposit_count),
        }

    @gl.public.view
    def get_last_withdraw(self) -> dict:
        return {
            "sender": str(self.last_withdraw_sender),
            "key": self.last_withdraw_key,
            "amount": int(self.last_withdraw_amount),
            "balance": int(self.last_withdraw_balance),
            "pending": int(self.last_withdraw_pending),
            "payout_requested_to": str(self.last_payout_requested_sender),
            "payout_requested_amount": int(self.last_payout_requested_amount),
            "payout_request_count": int(self.payout_request_count),
            "count": int(self.withdraw_count),
        }

    @gl.public.view
    def get_total_deposits(self) -> u256:
        return self.total_deposits

    @gl.public.view
    def get_total_pending_withdrawals(self) -> u256:
        return self.total_pending_withdrawals

    @gl.public.view
    def get_cooldown_remaining(self) -> u256:
        return u256(0)

    def _apply_strategy_allocation(self, strategy: str) -> None:
        if strategy == "aggressive":
            self.growth_allocation_bps = u256(7000)
            self.reserve_allocation_bps = u256(2000)
            self.protection_allocation_bps = u256(1000)
        elif strategy == "conservative":
            self.growth_allocation_bps = u256(2500)
            self.reserve_allocation_bps = u256(5500)
            self.protection_allocation_bps = u256(2000)
        else:
            self.growth_allocation_bps = u256(4500)
            self.reserve_allocation_bps = u256(4000)
            self.protection_allocation_bps = u256(1500)

        if (
            self.growth_allocation_bps
            + self.reserve_allocation_bps
            + self.protection_allocation_bps
        ) != BPS_TOTAL:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Invalid allocation")

    def _leader_market_decision(self) -> dict:
        response = gl.nondet.web.get(COINGECKO_URL)
        if response.status >= 400 and response.status < 500:
            raise gl.vm.UserError(f"{ERROR_EXTERNAL} CoinGecko returned {response.status}")
        if response.status >= 500:
            raise gl.vm.UserError(f"{ERROR_TRANSIENT} CoinGecko returned {response.status}")

        try:
            market = json.loads(response.body.decode("utf-8"))
        except Exception:
            raise gl.vm.UserError(f"{ERROR_EXTERNAL} Market data is not valid JSON")

        btc = market.get("bitcoin", {})
        price_usd = btc.get("usd")
        change_24h = btc.get("usd_24h_change")
        if price_usd is None or change_24h is None:
            raise gl.vm.UserError(f"{ERROR_EXTERNAL} Market data missing required fields")

        change_int = int(change_24h)
        abs_change = change_int if change_int >= 0 else -change_int

        if abs_change > 8:
            regime = "high_volatility"
            strategy = "conservative"
            confidence = 90
            reasoning = "BTC 24h change is above 8% absolute, so the vault moves defensive."
        elif change_int > 2:
            regime = "bull"
            strategy = "aggressive"
            confidence = 75
            reasoning = "BTC 24h change is above 2%, so the vault increases growth allocation."
        elif change_int < -2:
            regime = "bear"
            strategy = "conservative"
            confidence = 75
            reasoning = "BTC 24h change is below -2%, so the vault prioritizes reserves."
        else:
            regime = "sideways"
            strategy = "balanced"
            confidence = 70
            reasoning = "BTC 24h change is within +/-2%, so the vault stays balanced."

        return {
            "regime": regime,
            "strategy": strategy,
            "reasoning": reasoning,
            "confidence": confidence,
        }

    def _consensus_market_decision(self) -> dict:
        return gl.eq_principle.strict_eq(self._leader_market_decision)
