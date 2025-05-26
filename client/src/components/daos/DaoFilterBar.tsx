import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface DaoFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  categories: Category[];
  activeCategory: string;
  onActiveCategoryChange: (categoryId: string) => void;
  onRefetchFavorites: () => void;
  onRefetchMostActive: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  currentOrdering: string;
  onOrderingChange: (ordering: string) => void;
}

const DaoFilterBar: React.FC<DaoFilterBarProps> = ({
  searchTerm,
  onSearchTermChange,
  categories,
  activeCategory,
  onActiveCategoryChange,
  onRefetchFavorites,
  onRefetchMostActive,
  inputRef,
  currentOrdering,
  onOrderingChange,
}) => {
  const sortOptions = [
    { value: "-created_at", label: "Latest" },
    { value: "popular", label: "Most Popular" },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">DAOs Explorer</h1>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search DAOs..."
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              ref={inputRef}
            />
          </div>
          {activeCategory === "all" && (
            <Select value={currentOrdering} onValueChange={onOrderingChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="w-full overflow-auto mt-4">
        <div className="flex space-x-2 pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => {
                onActiveCategoryChange(category.id);
                if (category.id === "favorites") {
                  onRefetchFavorites();
                } else if (category.id === "active") {
                  onRefetchMostActive();
                }
              }}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default DaoFilterBar;
