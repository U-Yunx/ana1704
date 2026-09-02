/**
 * Configuration — the robot's trading-style preferences (scalping vs
 * long-term), which pairs it trades, whether it auto-picks the strongest pairs,
 * and overall run profit/loss targets. Persisted to localStorage.
 */
import { Save, SlidersHorizontal, Layers, ShieldCheck } from 'lucide-react'
import { useRobotPrefs, methodLabel } from '../lib/trading/robotPrefs'
import { WATCHLIST, isCryptoPair } from '../lib/watchlist'
import type { TradingMethod } from '../lib/types'
import type { TradeMode } from '../lib/trading/types'
import { cn } from '../lib/cn'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader } from '../components/ui'

export function Configuration() {
  const {
    prefs,
    setMethod,
    togglePair,
    setAutoPickPairs,
    setPairCount,
    setPerTradeTakeProfitPips,
    setPerTradeStopLossPips,
    setOverallMaxProfitUsd,
    setOverallMaxLossUsd,
    setTradeMode,
    setMaxPerPair,
    setMaxOpenTrades,
  } = useRobotPrefs()

  const handleSave = () => {
    // Values are persisted to localStorage on every change; this is a visible
    // confirmation point for the user.
    const el = document.getElementById('config-saved')
    if (el) {
      el.textContent = 'Preferences saved locally — they take effect on your next robot run.'
      el.classList.remove('opacity-0')
      setTimeout(() => el?.classList.add('opacity-0'), 2500)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        description="How the trading robot picks pairs and manages each run."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden="true" />
              Trading style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Trading style">
              {(['scalping', 'longterm'] as TradingMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={prefs.method === m}
                  className={cn(
                    'cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-semibold',
                    prefs.method === m
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
                  )}
                >
                  {methodLabel(m)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {prefs.method === 'scalping'
                ? 'Fast entries with tight stops and targets — suits 5-minute charts.'
                : 'Slower, wider-stopped trades that hold for larger moves — suits hourly charts.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pairs to trade</CardTitle>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={prefs.autoPickPairs}
                onChange={(e) => setAutoPickPairs(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
              />
              Auto-pick strongest
            </label>
          </CardHeader>
          <CardContent>
            {prefs.autoPickPairs ? (
              <div className="space-y-3">
                <Input
                  label="Number of pairs to auto-pick"
                  type="number"
                  min={1}
                  max={WATCHLIST.length}
                  step={1}
                  value={prefs.pairCount}
                  onChange={(e) => setPairCount(Math.max(1, Math.min(WATCHLIST.length, Number(e.target.value))))}
                />
                <p className="text-xs text-muted-foreground">
                  The robot ranks every watchlist pair by momentum + trend strength and trades the
                  top {prefs.pairCount}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {WATCHLIST.map((p) => {
                  const on = prefs.pairs.includes(p.symbol)
                  return (
                    <button
                      key={p.symbol}
                      type="button"
                      onClick={() => togglePair(p.symbol)}
                      aria-pressed={on}
                      className={cn(
                        'cursor-pointer rounded-lg border px-2.5 py-1.5 text-left text-xs',
                        on
                          ? 'border-accent/60 bg-accent/15 text-accent'
                          : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="font-medium">{p.symbol}</span>
                      {isCryptoPair(p.symbol) && <span className="ml-1 text-[10px] uppercase text-muted-foreground/70">crypto</span>}
                    </button>
                  )
                })}
              </div>
            )}
            {!prefs.autoPickPairs && prefs.pairs.length === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                No pairs selected yet — the robot will default to the first pair on the watchlist.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
              Trade mode &amp; concurrency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Trade mode">
              {(['sequential', 'concurrent'] as TradeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTradeMode(mode)}
                  aria-pressed={prefs.tradeMode === mode}
                  className={cn(
                    'cursor-pointer rounded-lg border px-3 py-2.5 text-left text-sm font-semibold',
                    prefs.tradeMode === mode
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
                  )}
                >
                  {mode === 'sequential' ? 'Sequential' : 'Concurrent'}
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {mode === 'sequential'
                      ? 'One open position per pair — signals on a busy pair are skipped until it closes.'
                      : 'Several positions per pair — up to the per-pair cap on every watchlist pair.'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Max positions per pair"
                type="number"
                min={1}
                step={1}
                value={prefs.maxPerPair}
                disabled={prefs.tradeMode === 'sequential'}
                onChange={(e) => setMaxPerPair(Math.max(1, Math.round(Number(e.target.value))))}
              />
              <Input
                label="Max open trades (whole robot)"
                type="number"
                min={1}
                step={1}
                value={prefs.maxOpenTrades}
                onChange={(e) => setMaxOpenTrades(Math.max(1, Math.round(Number(e.target.value))))}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {prefs.tradeMode === 'sequential'
                ? 'Sequential holds a single position per pair, so the per-pair cap is fixed at 1 — the global cap above still limits the whole robot.'
                : `Concurrent can hold up to ${prefs.maxPerPair} position${prefs.maxPerPair === 1 ? '' : 's'} on each pair, bounded by the ${prefs.maxOpenTrades} global open-trade cap.`}
              {' '}Both caps are enforced by the trading engine on every cycle, so a busy market can never over-leverage the account.
            </p>
            {prefs.tradeMode === 'concurrent' && prefs.maxPerPair > prefs.maxOpenTrades && (
              <p role="alert" className="mt-2 flex items-start gap-2 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-amber">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Max per pair ({prefs.maxPerPair}) is higher than the global cap ({prefs.maxOpenTrades}). The global cap
                wins, so at most {prefs.maxOpenTrades} positions open across the whole robot.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Run limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Input
                label="Per-trade take-profit (pips)"
                type="number"
                min={0}
                step={1}
                value={prefs.perTradeTakeProfitPips}
                onChange={(e) => setPerTradeTakeProfitPips(Number(e.target.value))}
              />
              <Input
                label="Per-trade stop-loss (pips)"
                type="number"
                min={0}
                step={1}
                value={prefs.perTradeStopLossPips}
                onChange={(e) => setPerTradeStopLossPips(Number(e.target.value))}
              />
              <Input
                label="Overall max profit (USD)"
                type="number"
                min={0}
                step={10}
                value={prefs.overallMaxProfitUsd}
                onChange={(e) => setOverallMaxProfitUsd(Number(e.target.value))}
              />
              <Input
                label="Overall max loss (USD)"
                type="number"
                min={0}
                step={10}
                value={prefs.overallMaxLossUsd}
                onChange={(e) => setOverallMaxLossUsd(Number(e.target.value))}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Leave per-trade values at 0 to let the robot size stops from market volatility (ATR).
            </p>

            <p id="config-saved" className="mt-3 rounded-lg border border-up/40 bg-up/10 px-3 py-2 text-xs text-up opacity-0 transition-opacity">
              Preferences saved locally — they take effect on your next robot run.
            </p>
            <Button className="mt-4" onClick={handleSave}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}