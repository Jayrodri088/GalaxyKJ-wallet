"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  label: string;
}

interface CategoryTabsProps {
  categories: Category[];
  defaultCategory?: string;
  onChange?: (categoryId: string) => void;
}

export default function CategoryTabs({
  categories,
  defaultCategory = categories[0]?.id,
  onChange,
}: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState(defaultCategory);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (onChange) {
      onChange(categoryId);
    }
  };

  return (
    <div className="border-b border-border">
      <div className="flex overflow-x-auto hide-scrollbar">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeCategory === category.id
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}
