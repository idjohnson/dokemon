import Loading from "@/components/widgets/loading"
import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/widgets/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IImage } from "@/lib/api-models"
import { useMemo, useState } from "react"
import useImages from "@/hooks/useImages"
import { convertByteToMb, toastFailed, toastSuccess } from "@/lib/utils"
import MainArea from "@/components/widgets/main-area"
import TopBar from "@/components/widgets/top-bar"
import TopBarActions from "@/components/widgets/top-bar-actions"
import MainContent from "@/components/widgets/main-content"
import { useParams } from "react-router-dom"
import useNodeHead from "@/hooks/useNodeHead"
import TableButtonDelete from "@/components/widgets/table-button-delete"
import { TableNoData } from "@/components/widgets/table-no-data"
import apiBaseUrl from "@/lib/api-base-url"
import DeleteDialog from "@/components/delete-dialog"
import { Input } from "@/components/ui/input"
import { SortableIcon } from "@/components/widgets/sortable-icon"

type SortKey = "id" | "name" | "tag" | "status" | "size"

export default function ImageList() {
  const { nodeId } = useParams()
  const { nodeHead } = useNodeHead(nodeId!)
  const { isLoading, images, mutateImages } = useImages(nodeId!)
  const [image, setImage] = useState<IImage | null>(null)
  const [deleteImageConfirmationOpen, setDeleteImageConfirmationOpen] =
    useState(false)
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [pruneInProgress, setPruneInProgress] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const sortedAndFilteredImages = useMemo(() => {
    if (!images?.items) return []

    const filtered = images.items.filter((image) =>
      image.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number = ""
      let bValue: string | number = ""

      switch (sortKey) {
        case "id":
          aValue = a.id
          bValue = b.id
          break
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "tag":
          aValue = a.tag
          bValue = b.tag
          break
        case "status":
          aValue = a.inUse ? "In use" : "Unused"
          bValue = b.inUse ? "In use" : "Unused"
          break
        case "size":
          aValue = a.size
          bValue = b.size
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
  }, [images, searchTerm, sortKey, sortOrder])

  if (isLoading) return <Loading />

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const handleDeleteImageConfirmation = (image: IImage) => {
    setImage({ ...image })
    setDeleteImageConfirmationOpen(true)
  }

  const handleDelete = async () => {
    setDeleteInProgress(true)
    const response = await fetch(
      `${apiBaseUrl()}/nodes/${nodeId}/images/remove`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: image?.id, force: false }),
      }
    )
    if (!response.ok) {
      const r = await response.json()
      setDeleteImageConfirmationOpen(false)
      toastFailed(r.errors?.body)
    } else {
      mutateImages()
      setTimeout(() => {
        setDeleteImageConfirmationOpen(false)
        toastSuccess("Image deleted.")
      }, 500)
    }
    setDeleteInProgress(false)
  }

  const handlePrune = async () => {
    setPruneInProgress(true)
    const response = await fetch(
      `${apiBaseUrl()}/nodes/${nodeId}/images/prune`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      }
    )
    if (!response.ok) {
      const r = await response.json()
      toastFailed(r.errors?.body)
    } else {
      mutateImages()
      const r = await response.json()
      let description = "Nothing found to delete"
      if (r.imagesDeleted?.length > 0) {
        description = `Unused images deleted. Space reclaimed: ${convertByteToMb(
          r.spaceReclaimed
        )}`
      }
      setTimeout(async () => {
        toastSuccess(description)
      }, 500)
    }
    setPruneInProgress(false)
  }

  return (
    <MainArea>
      {deleteImageConfirmationOpen && (
        <DeleteDialog
          openState={deleteImageConfirmationOpen}
          setOpenState={setDeleteImageConfirmationOpen}
          deleteCaption=""
          deleteHandler={handleDelete}
          isProcessing={deleteInProgress}
          title="Delete Image"
          message={`Are you sure you want to delete image '${image?.name}?'`}
        />
      )}
      <TopBar>
        <Breadcrumb>
          <BreadcrumbLink to="/nodes">Nodes</BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbCurrent>{nodeHead?.name}</BreadcrumbCurrent>
          <BreadcrumbSeparator />
          <BreadcrumbCurrent>Images</BreadcrumbCurrent>
        </Breadcrumb>
        <TopBarActions>
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search images..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DeleteDialog
              widthClass="w-42"
              deleteCaption="Delete Unused (Prune All)"
              deleteHandler={handlePrune}
              isProcessing={pruneInProgress}
              title="Delete Unused"
              message={`Are you sure you want to delete all unused images?`}
            />
          </div>
        </TopBarActions>
      </TopBar>
      <MainContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("id")}
              >
                Id
                <SortableIcon
                  sortKey="id"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Name
                <SortableIcon
                  sortKey="name"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("tag")}
              >
                Tag
                <SortableIcon
                  sortKey="tag"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status
                <SortableIcon
                  sortKey="status"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("size")}
              >
                Size
                <SortableIcon
                  sortKey="size"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredImages.length === 0 && <TableNoData colSpan={5} />}
            {sortedAndFilteredImages.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id.substring(7, 19)}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  {item.tag}{" "}
                  {item.dangling ? (
                    <span className="text-xs text-red-400"> (Dangling)</span>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell>{item.inUse ? "In use" : "Unused"}</TableCell>
                <TableCell>{convertByteToMb(item.size)}</TableCell>
                <TableCell className="text-right">
                  {!item.inUse && (
                    <TableButtonDelete
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteImageConfirmation(item)
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </MainContent>
    </MainArea>
  )
}

