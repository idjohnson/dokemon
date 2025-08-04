import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react"

interface SortableIconProps<T> {
  sortKey: T
  currentSortKey: T
  sortOrder: "asc" | "desc"
}

export function SortableIcon<T>({
  sortKey,
  currentSortKey,
  sortOrder,
}: SortableIconProps<T>) {
  if (sortKey !== currentSortKey) {
    return <ChevronsUpDown className="ml-2 inline w-4" />
  }
  if (sortOrder === "asc") {
    return <ChevronUp className="ml-2 inline w-4" />
  }
  return <ChevronDown className="ml-2 inline w-4" />
}
