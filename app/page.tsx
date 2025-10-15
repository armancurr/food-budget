"use client";

import { useState, useEffect } from "react";
import { BudgetSettings } from "@/components/budget-settings";
import {
  FoodItemForm,
  FoodItemList,
  type FoodItem,
} from "@/components/food-item-form";
import { TodayPlan } from "@/components/today-plan";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ProgressState = {
  month: string;
  spent: number;
  streak: number;
  points: number;
  lastCompletedDate?: string;
};

function getMonthId(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function getDateId(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysInMonth(year: number, monthIndexZeroBased: number) {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

export default function HomePage() {
  const month = getMonthId();
  const [items, setItems] = useLocalStorage<FoodItem[]>("fb-items-v1", []);
  const [budget, setBudget] = useLocalStorage<number>("fb-budget-v1", 0);
  const [progress, setProgress] = useLocalStorage<ProgressState>(
    "fb-progress-v1",
    {
      month,
      spent: 0,
      streak: 0,
      points: 0,
    },
  );
  const [rerollsToday, setRerollsToday] = useLocalStorage<number>(
    `fb-rerolls-${getDateId()}`,
    0,
  );

  // Move the monthly reset into an effect so we don't perform state updates during render.
  // Updating state during render can cause hydration mismatches in Next.js.
  useEffect(() => {
    if (progress.month !== month) {
      setProgress({ month, spent: 0, streak: 0, points: 0 });
    }
    // We intentionally include `progress.month` so the effect runs when stored month changes.
  }, [month, progress.month, setProgress]);

  const today = getDateId();
  const [todayPlanKey] = useState(`fb-plan-${today}`);
  const [todayPlan, setTodayPlan] = useLocalStorage<{
    breakfastId?: string;
    lunchId?: string;
    dinnerId?: string;
    total?: number;
    skipBreakfast?: boolean;
    skipLunch?: boolean;
    skipDinner?: boolean;
  }>(todayPlanKey, {});

  const monthParts = month.split("-").map(Number);
  const totalDays = daysInMonth(monthParts[0], monthParts[1] - 1);
  const todayDate = new Date();
  const dayIndex = todayDate.getDate(); // 1..totalDays
  const remainingDays = Math.max(1, totalDays - dayIndex + 1);
  const remainingBudget = Math.max(0, (budget || 0) - (progress.spent || 0));
  const dailyAllowance = (remainingBudget || 0) / remainingDays;

  const spentPercent =
    budget > 0 ? Math.min(100, Math.round((progress.spent / budget) * 100)) : 0;

  const onAddItem = (newItem: FoodItem) => {
    setItems((prev) => [...prev, newItem]);
  };
  const onDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };
  const onUpdateBudget = (value: number) => {
    setBudget(value);
  };

  const [showMeals, setShowMeals] = useLocalStorage<boolean>(
    "fb-show-meals-v1",
    true,
  );

  const hasBreakfast = items.some(
    (i) => i.meal === "breakfast" || i.meal === "any",
  );
  const hasLunch = items.some((i) => i.meal === "lunch" || i.meal === "any");
  const hasDinner = items.some((i) => i.meal === "dinner" || i.meal === "any");
  const setupComplete = hasBreakfast && hasLunch && hasDinner;

  useEffect(() => {
    if (setupComplete && showMeals) {
      const flagged =
        typeof window !== "undefined" &&
        window.localStorage.getItem("fb-meals-autohid-v1");
      if (!flagged) {
        setShowMeals(false);
        try {
          window.localStorage.setItem("fb-meals-autohid-v1", "1");
        } catch {}
      }
    }
  }, [setupComplete, showMeals, setShowMeals]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <section className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BudgetSettings budget={budget} onChange={onUpdateBudget} />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Spent</span>
                <span className="font-medium">{`$${(progress.spent || 0).toFixed(2)} / $${(budget || 0).toFixed(2)}`}</span>
              </div>
              <Progress value={spentPercent} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6">
        <TodayPlan
          items={items}
          dailyAllowance={dailyAllowance}
          todayPlan={todayPlan}
          setTodayPlan={setTodayPlan}
          onComplete={(total, underBudget) => {
            setProgress((p) => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const prevDay = p.lastCompletedDate;
              const isConsecutive = prevDay === getDateId(yesterday);
              const newStreak = underBudget
                ? isConsecutive
                  ? (p.streak || 0) + 1
                  : 1
                : 0;
              const pointsGain = underBudget ? 10 : 0;
              return {
                month: p.month,
                spent: (p.spent || 0) + total,
                streak: newStreak,
                points: (p.points || 0) + pointsGain,
                lastCompletedDate: getDateId(),
              };
            });
            setRerollsToday(0);
          }}
          onReroll={() => {
            setProgress((p) => ({
              ...p,
              points: Math.max(0, (p.points || 0) - 2),
            }));
            setRerollsToday((n) => (n || 0) + 1);
          }}
          rerollsToday={rerollsToday}
          onManageMeals={() => setShowMeals(true)}
        />

        {showMeals && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manage Meals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FoodItemForm onAdd={onAddItem} />
              <FoodItemList items={items} onDelete={onDeleteItem} />
              {setupComplete && (
                <div className="pt-1">
                  <button
                    type="button"
                    className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowMeals(false)}
                  >
                    Hide meal list
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
