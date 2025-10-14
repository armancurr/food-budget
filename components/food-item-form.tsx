"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export type MealType = "breakfast" | "lunch" | "dinner" | "any"
export type FoodItem = {
  id: string
  name: string
  meal: MealType
  price: number
}

export function FoodItemForm({ onAdd }: { onAdd: (item: FoodItem) => void }) {
  const [name, setName] = useState("")
  const [meal, setMeal] = useState<MealType>("any")
  const [price, setPrice] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = Number(price)
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter a dish name." })
      return
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: "Invalid price", description: "Enter a positive number." })
      return
    }
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      meal,
      price: Number(priceNum.toFixed(2)),
    })
    setName("")
    setMeal("any")
    setPrice("")
  }

  return (
    <form className="grid gap-2" onSubmit={submit}>
      <Label htmlFor="name">Dish name</Label>
      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Oatmeal with banana" />

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label htmlFor="meal">Meal</Label>
          <select
            id="meal"
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={meal}
            onChange={(e) => setMeal(e.target.value as MealType)}
          >
            <option value="any">Any</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g., 3.50"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full">
          Add
        </Button>
      </div>
    </form>
  )
}

export function FoodItemList({ items, onDelete }: { items: FoodItem[]; onDelete: (id: string) => void }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No meals yet. Add a few items for each meal to get better recommendations.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-2 rounded-md border px-3 py-2 bg-background">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate max-w-[180px]">{i.name}</div>
            <div className="text-xs text-muted-foreground">{`$${i.price.toFixed(2)} • ${i.meal}`}</div>
          </div>
          <button
            type="button"
            aria-label="Delete"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted ml-1 shrink-0"
            onClick={() => onDelete(i.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
