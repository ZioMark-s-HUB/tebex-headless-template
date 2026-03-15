"use client";

import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CategoriesNavMenuProps = {
  categories: Array<{ id: number; name: string }>;
};

export function CategoriesNavMenu({ categories }: CategoriesNavMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <LayoutGrid className="mr-2 h-4 w-4" />
          Categories
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem asChild>
          <Link href="/categories">All categories</Link>
        </DropdownMenuItem>
        {categories.map((category) => (
          <DropdownMenuItem key={category.id} asChild>
            <Link href={`/category/${category.id}`}>{category.name}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
