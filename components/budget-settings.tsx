"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export function BudgetSettings({ budget, onChange }: { budget: number; onChange: (v: number) => void }) {
  const [value, setValue] = useState(budget ? String(budget) : "")

  return (
    <form
      vare
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const num = Number(value)
        if (isNaN(num) || num < 0) {
          toast({ title: "Invalid budget", description: "Please enter a non-negative number." })
          return
        }
        onChange(Number(num.toFixed(2)))
        toast({ title: "Budget saved", description: `Monthly budget set to $${num.toFixed(2)}` })
      }}
    >
      <Label htmlFor="budget">Monthly Budget (USD)</Label>
      <div className="flex items-center gap-2">
        <Input
          id="budget"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., 300"
          className="max-w-[180px]"
        />
        <Button type="submit" variant="default">
          Save
        </Button>
      </div>
    </form>
  )
}
