# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json

STRATEGIES = ("conservative", "balanced", "aggressive")
REGIMES = ("bull", "bear", "sideways", "high_volatility")

ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"
ERROR_TRANSIENT = "[TRANSIENT]"
COINGECKO_URL = (
    "https://api.coingecko.com/api/v3/simple/price"
    "?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
)


class Liverome(gl.Contract):
    total_deposits: u256
    balances: TreeMap[str, u256]

    current_strategy: str
    last_rebalance_regime: str
    last_rebalance_reasoning: str
    last_rebalance_confidence: u256
    rebalance_count: u256

    last_deposit_sender: Address
    last_deposit_key: str
    last_deposit_value: u256
    last_deposit_balance: u256
    deposit_count: u256

    last_withdraw_sender: Address
    last_withdraw_key: str
    last_withdraw_amount: u256
    last_withdraw_balance: u256
    withdraw_count: u256

    def __init__(self):
        sender = gl.message.sender_address
        key = str(sender)

        self.total_deposits = u256(0)
        self.current_strategy = "balanced"
        self.last_rebalance_regime = "sideways"
        self.last_rebalance_reasoning = "Initial state."
        self.last_rebalance_confidence = u256(0)
        self.rebalance_count = u256(0)

        self.last_deposit_sender = sender
        self.last_deposit_key = key
        self.last_deposit_value = u256(0)
        self.last_deposit_balance = u256(0)
        self.deposit_count = u256(0)

        self.last_withdraw_sender = sender
        self.last_withdraw_key = key
        self.last_withdraw_amount = u256(0)
        self.last_withdraw_balance = u256(0)
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
        self.balances[key] = new_balance
        self.total_deposits = self.total_deposits - amount
        self.last_withdraw_sender = sender
        self.last_withdraw_key = key
        self.last_withdraw_amount = amount
        self.last_withdraw_balance = new_balance
        self.withdraw_count = self.withdraw_count + u256(1)

    @gl.public.write
    def rebalance(self) -> None:
        decision = self._consensus_market_decision()

        self.current_strategy = str(decision["strategy"])
        self.last_rebalance_regime = str(decision["regime"])
        self.last_rebalance_reasoning = str(decision["reasoning"])[:300]
        self.last_rebalance_confidence = u256(int(decision["confidence"]))
        self.rebalance_count = self.rebalance_count + u256(1)

    @gl.public.view
    def get_strategy(self) -> str:
        return self.current_strategy

    @gl.public.view
    def get_history(self) -> list[dict]:
        return [
            {
                "strategy": self.current_strategy,
                "new_strategy": self.current_strategy,
                "old_strategy": "balanced",
                "regime": self.last_rebalance_regime,
                "reasoning": self.last_rebalance_reasoning,
                "confidence": int(self.last_rebalance_confidence),
                "rebalance_count": int(self.rebalance_count),
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
    def get_my_balance(self) -> u256:
        return self.balances.get(str(gl.message.sender_address), u256(0))

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
            "count": int(self.withdraw_count),
        }

    @gl.public.view
    def get_total_deposits(self) -> u256:
        return self.total_deposits

    @gl.public.view
    def get_cooldown_remaining(self) -> u256:
        return u256(0)

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
        elif change_int > 2:
            regime = "bull"
            strategy = "aggressive"
            confidence = 75
        elif change_int < -2:
            regime = "bear"
            strategy = "conservative"
            confidence = 75
        else:
            regime = "sideways"
            strategy = "balanced"
            confidence = 70

        return {
            "regime": regime,
            "strategy": strategy,
            "reasoning": "Deterministic CoinGecko BTC 24h change classifier.",
            "confidence": confidence,
        }

    def _consensus_market_decision(self) -> dict:
        return gl.eq_principle.strict_eq(self._leader_market_decision)

    def _strategy_matches_regime(self, strategy: str, regime: str) -> bool:
        if regime == "bull":
            return strategy in ("balanced", "aggressive")
        if regime == "sideways":
            return strategy == "balanced"
        if regime == "bear" or regime == "high_volatility":
            return strategy == "conservative"
        return False
