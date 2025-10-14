"use client"

import { useEffect } from "react"
import type { FoodItem } from "./food-item-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

type PlanState = {
  breakfastId?: string
  lunchId?: string
  dinnerId?: string
  total?: number
  skipBreakfast?: boolean
  skipLunch?: boolean
  skipDinner?: boolean
}

type Props = {
  items: FoodItem[]
  dailyAllowance: number
  todayPlan: PlanState
  setTodayPlan: (p: PlanState | ((prev: PlanState) => PlanState)) => void
  onComplete: (total: number, underBudget: boolean) => void
  onReroll: () => void
  rerollsToday: number
  onManageMeals?: () => void
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function cheapest<T>(arr: T[], getPrice: (t: T) => number) {
  return [...arr].sort((a, b) => getPrice(a) - getPrice(b))[0]
}

function buildPools(items: FoodItem[]) {
  const any = items.filter((i) => i.meal === "any")
  const b = [...items.filter((i) => i.meal === "breakfast"), ...any]
  const l = [...items.filter((i) => i.meal === "lunch"), ...any]
  const d = [...items.filter((i) => i.meal === "dinner"), ...any]
  return { b, l, d }
}

function tryRecommend(items: FoodItem[], allowance: number): PlanState | null {
  const { b, l, d } = buildPools(items)
  if (!b.length || !l.length || !d.length) return null

  const attempts = 50
  for (let i = 0; i < attempts; i++) {
    const bi = pickRandom(b)
    const li = pickRandom(l)
    const di = pickRandom(d)
    const total = bi.price + li.price + di.price
    if (total <= allowance) {
      return {
        breakfastId: bi.id,
        lunchId: li.id,
        dinnerId: di.id,
        total: Number(total.toFixed(2)),
        skipBreakfast: false,
        skipLunch: false,
        skipDinner: false,
      }
    }
  }

  const cb = cheapest(b, (x) => x.price)
  const cl = cheapest(l, (x) => x.price)
  const cd = cheapest(d, (x) => x.price)
  const total = cb.price + cl.price + cd.price
  return {
    breakfastId: cb.id,
    lunchId: cl.id,
    dinnerId: cd.id,
    total: Number(total.toFixed(2)),
    skipBreakfast: false,
    skipLunch: false,
    skipDinner: false,
  }
}

export function TodayPlan({
  items,
  dailyAllowance,
  todayPlan,
  setTodayPlan,
  onComplete,
  onReroll,
  rerollsToday,
  onManageMeals,
}: Props) {
  useEffect(() => {
    if ((!todayPlan.breakfastId || !todayPlan.lunchId || !todayPlan.dinnerId) && items.length >= 3) {
      const rec = tryRecommend(items, dailyAllowance)
      if (rec) setTodayPlan(rec)
    }
  }, [items, dailyAllowance])

  const indexById = new Map(items.map((i) => [i.id, i]))
  const b = todayPlan.breakfastId ? indexById.get(todayPlan.breakfastId) : undefined
  const l = todayPlan.lunchId ? indexById.get(todayPlan.lunchId) : undefined
  const d = todayPlan.dinnerId ? indexById.get(todayPlan.dinnerId) : undefined

  const total = Number(
    (
      (todayPlan.skipBreakfast ? 0 : b?.price || 0) +
      (todayPlan.skipLunch ? 0 : l?.price || 0) +
      (todayPlan.skipDinner ? 0 : d?.price || 0)
    ).toFixed(2),
  )
  const underBudget = total <= dailyAllowance

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Today’s suggestion</CardTitle>
        {onManageMeals && (
          <Button variant="link" className="h-auto p-0 text-sm" onClick={onManageMeals}>
            Manage meals
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!b || !l || !d ? (
          <p className="text-sm text-muted-foreground">
            Add at least one item for each meal (or tag some as "Any") to get a daily plan.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row">
              <MealCard
                label="Breakfast"
                item={b}
                skipped={!!todayPlan.skipBreakfast}
                onToggleSkip={() =>
                  setTodayPlan((prev) => ({ ...prev, skipBreakfast: !prev.skipBreakfast, total: undefined }))
                }
              />
              <MealCard
                label="Lunch"
                item={l}
                skipped={!!todayPlan.skipLunch}
                onToggleSkip={() => setTodayPlan((prev) => ({ ...prev, skipLunch: !prev.skipLunch, total: undefined }))}
              />
              <MealCard
                label="Dinner"
                item={d}
                skipped={!!todayPlan.skipDinner}
                onToggleSkip={() =>
                  setTodayPlan((prev) => ({ ...prev, skipDinner: !prev.skipDinner, total: undefined }))
                }
              />
            </div>

            <div className="flex items-end justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const rec = tryRecommend(items, dailyAllowance)
                  if (rec) {
                    setTodayPlan(rec)
                    onReroll()
                    toast({ title: "New suggestion" })
                  } else {
                    toast({ title: "Need more items", description: "Add more meals to generate a plan." })
                  }
                }}
              >
                New suggestion
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!b || !l || !d) return
                  onComplete(total, underBudget)
                  toast({ title: "Day recorded" })
                }}
              >
                Complete day
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function MealCard({
  label,
  item,
  skipped,
  onToggleSkip,
}: {
  label: string
  item?: FoodItem
  skipped?: boolean
  onToggleSkip?: () => void
}) {
  if (!item) return null
  return (
    <Card className="flex-1 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <div className={`font-medium ${skipped ? "line-through opacity-60" : ""}`}>{item.name}</div>
          <div className={`text-xs text-muted-foreground ${skipped ? "line-through opacity-60" : ""}`}>
            {`$${item.price.toFixed(2)}`}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onToggleSkip}>
          {skipped ? "Unskip" : "Skip"}
        </Button>
      </CardContent>
    </Card>
  )
}
