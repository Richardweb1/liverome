# Liverome Frontend — à construire

Stack: **Next.js + genlayer-js**. Le client + les wrappers de contrat sont
déjà prêts dans `lib/`. Il reste à construire les composants et pages.

## Setup

```bash
npx create-next-app@latest . --typescript --tailwind --app
npm install genlayer-js
```

Crée `.env.local`:
```
NEXT_PUBLIC_NETWORK=studio
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...   # rempli après le déploiement (deploy/deployed-address.json)
```

## Composants à créer dans `components/`

- **StrategyBadge.tsx** — affiche `current_strategy` avec une couleur selon
  le risque (vert=conservative, jaune=balanced, rouge=aggressive). Utilise
  `getStrategy()` depuis `lib/contractCalls.ts`.

- **DepositWithdrawForm.tsx** — deux champs montant + deux boutons, appelle
  `deposit()` / `withdraw()`. Affiche `getUserBalance()` en live après chaque tx.

- **CooldownTimer.tsx** — countdown basé sur `getCooldownRemaining()`
  (poll toutes les 10-15s ou au chargement), désactive le bouton rebalance
  tant que > 0.

- **RebalanceButton.tsx** — appelle `rebalance()`. Affiche un état "loading"
  clair car ça peut prendre du temps (fetch web + LLM + consensus).
  Disabled si `CooldownTimer` indique un cooldown actif.

- **HistoryTimeline.tsx** — liste `getHistory()`: pour chaque entrée affiche
  `old_strategy -> new_strategy`, `reasoning`, `confidence` (en %), et le
  timestamp formaté.

## Hooks à créer dans `hooks/`

- **useUserBalance.ts** — wrap `getUserBalance()` + refetch après deposit/withdraw
- **useStrategy.ts** — wrap `getStrategy()` + refetch après rebalance
- **useHistory.ts** — wrap `getHistory()`

## Page principale (`app/page.tsx`)

Dashboard simple:
```
[ StrategyBadge ]
[ DepositWithdrawForm ]
[ CooldownTimer ] [ RebalanceButton ]
[ HistoryTimeline ]
```

## Notes

- `rebalance()` peut prendre plusieurs dizaines de secondes (web fetch x3 +
  appel LLM + consensus multi-validateurs) — prévoir un vrai indicateur de
  progression, pas juste un spinner générique.
- Le wallet: pour du vrai testnet (Bradbury), brancher un wallet réel plutôt
  que générer une clé côté client (voir `getClient()` dans `lib/genlayerClient.ts`
  qui accepte une clé privée — à remplacer par une intégration wallet propre).
