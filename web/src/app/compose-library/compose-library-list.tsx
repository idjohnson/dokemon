import Loading from "@/components/widgets/loading"
import { Breadcrumb, BreadcrumbCurrent } from "@/components/widgets/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import MainArea from "@/components/widgets/main-area"
import TopBar from "@/components/widgets/top-bar"
import TopBarActions from "@/components/widgets/top-bar-actions"
import MainContent from "@/components/widgets/main-content"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import useComposeLibraryItemList from "@/hooks/useComposeLibraryItemList"
import { CLASSES_CLICKABLE_TABLE_ROW } from "@/lib/utils"
import { TableNoData } from "@/components/widgets/table-no-data"
import { useMemo, useState } from "react"
import { SortableIcon } from "@/components/widgets/sortable-icon"

type SortKey = "projectName" | "type"

export default function ComposeLibraryList() {
  const navigate = useNavigate()
  const { isLoading, composeLibraryItems } = useComposeLibraryItemList()
  const [sortKey, setSortKey] = useState<SortKey>("projectName")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const sortedAndFilteredLibraryItems = useMemo(() => {
    if (!composeLibraryItems?.items) return []

    const sorted = [...composeLibraryItems.items].sort((a, b) => {
      let aValue: string = ""
      let bValue: string = ""

      switch (sortKey) {
        case "projectName":
          aValue = a.projectName
          bValue = b.projectName
          break
        case "type":
          aValue = a.type
          bValue = b.type
          break
        default:
          break
      }

      if (aValue < bValue) {
        return sortOrder === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortOrder === "asc" ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [composeLibraryItems, sortKey, sortOrder])

  if (isLoading) return <Loading />

  return (
    <MainArea>
      <TopBar>
        <Breadcrumb>
          <BreadcrumbCurrent>Compose Library</BreadcrumbCurrent>
        </Breadcrumb>
        <TopBarActions>
          <Button
            className="w-24"
            onClick={() => navigate("/composelibrary/filesystem/create")}
          >
            Create
          </Button>
          <Button
            className="w-36"
            onClick={() => navigate("/composelibrary/github/create")}
          >
            Add from GitHub
          </Button>
        </TopBarActions>
      </TopBar>
      <MainContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("projectName")}
              >
                Library Project Name
                <SortableIcon
                  sortKey="projectName"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("type")}
              >
                Type
                <SortableIcon
                  sortKey="type"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {composeLibraryItems?.totalRows === -1 && (
              <TableNoData colSpan={3} />
            )}
            {sortedAndFilteredLibraryItems.map((item) => (
              <TableRow
                key={item.projectName}
                className={CLASSES_CLICKABLE_TABLE_ROW}
                onClick={() => {
                  if (item.type === "filesystem") {
                    navigate(
                      `/composelibrary/${item.type}/${item.projectName}/edit`
                    )
                  }
                  if (item.type === "github") {
                    navigate(`/composelibrary/${item.type}/${item.id}/edit`)
                  }
                }}
              >
                <TableCell>{item.projectName}</TableCell>
                <TableCell>
                  {item.type === "filesystem" ? "File System" : ""}
                  {item.type === "github" ? "GitHub" : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </MainContent>
    </MainArea>
  )
}
