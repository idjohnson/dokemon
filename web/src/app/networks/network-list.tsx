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
import { INetwork } from "@/lib/api-models"
import { useMemo, useState } from "react"
import useNetworks from "@/hooks/useNetworks"
import MainArea from "@/components/widgets/main-area"
import TopBar from "@/components/widgets/top-bar"
import TopBarActions from "@/components/widgets/top-bar-actions"
import MainContent from "@/components/widgets/main-content"
import { useParams } from "react-router-dom"
import useNodeHead from "@/hooks/useNodeHead"
import TableButtonDelete from "@/components/widgets/table-button-delete"
import { TableNoData } from "@/components/widgets/table-no-data"
import { toastFailed, toastSuccess } from "@/lib/utils"
import apiBaseUrl from "@/lib/api-base-url"
import DeleteDialog from "@/components/delete-dialog"
import { Input } from "@/components/ui/input"
import { SortableIcon } from "@/components/widgets/sortable-icon"

const systemNetwoks = [
  "none",
  "bridge",
  "host",
  "ingress",
  "docker_gwbridge",
  "docker_volumes-backup-extension-desktop-extension_default",
]

type SortKey = "id" | "name" | "driver" | "scope" | "status"

export default function NetworkList() {
  const { nodeId } = useParams()
  const { nodeHead } = useNodeHead(nodeId!)
  const { isLoading, networks, mutateNetworks } = useNetworks(nodeId!)

  const [network, setNetwork] = useState<INetwork | null>(null)
  const [deleteNetworkOpenConfirmation, setDeleteNetworkOpenConfirmation] =
    useState(false)
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [pruneInProgress, setPruneInProgress] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const sortedAndFilteredNetworks = useMemo(() => {
    if (!networks?.items) return []

    const filtered = networks.items.filter((network) =>
      network.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        case "driver":
          aValue = a.driver
          bValue = b.driver
          break
        case "scope":
          aValue = a.scope
          bValue = b.scope
          break
        case "status":
          aValue = a.inUse ? "In use" : "Unused"
          bValue = b.inUse ? "In use" : "Unused"
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
  }, [networks, searchTerm, sortKey, sortOrder])

  if (isLoading) return <Loading />

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const handleDeleteNetworkConfirmation = (network: INetwork) => {
    setNetwork({ ...network })
    setDeleteNetworkOpenConfirmation(true)
  }

  const handleDelete = async () => {
    setDeleteInProgress(true)
    const response = await fetch(
      `${apiBaseUrl()}/nodes/${nodeId}/networks/remove`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: network?.id, force: true }),
      }
    )
    if (!response.ok) {
      const r = await response.json()
      setDeleteNetworkOpenConfirmation(false)
      toastFailed(r.errors?.body)
    } else {
      mutateNetworks()
      setTimeout(() => {
        setDeleteNetworkOpenConfirmation(false)
        toastSuccess("Network deleted.")
      }, 500)
    }
    setDeleteInProgress(false)
  }

  const handlePrune = async () => {
    setPruneInProgress(true)
    const response = await fetch(
      `${apiBaseUrl()}/nodes/${nodeId}/networks/prune`,
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
      mutateNetworks()
      const r = await response.json()
      let description = "Nothing found to delete"
      if (r.networksDeleted?.length > 0) {
        description = `${r.networksDeleted.length} unused networks deleted`
      }
      setTimeout(async () => {
        toastSuccess(description)
      }, 500)
    }
    setPruneInProgress(false)
  }

  return (
    <MainArea>
      {deleteNetworkOpenConfirmation && (
        <DeleteDialog
          openState={deleteNetworkOpenConfirmation}
          setOpenState={setDeleteNetworkOpenConfirmation}
          deleteCaption=""
          deleteHandler={handleDelete}
          isProcessing={deleteInProgress}
          title="Delete Network"
          message={`Are you sure you want to delete network '${network?.name}?'`}
        />
      )}
      <TopBar>
        <Breadcrumb>
          <BreadcrumbLink to="/nodes">Nodes</BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbCurrent>{nodeHead?.name}</BreadcrumbCurrent>
          <BreadcrumbSeparator />
          <BreadcrumbCurrent>Networks</BreadcrumbCurrent>
        </Breadcrumb>
        <TopBarActions>
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search networks..."
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
              message={`Are you sure you want to delete all unused networks?`}
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
                onClick={() => handleSort("driver")}
              >
                Driver
                <SortableIcon
                  sortKey="driver"
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer"
                onClick={() => handleSort("scope")}
              >
                Scope
                <SortableIcon
                  sortKey="scope"
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
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredNetworks.length === 0 && (
              <TableNoData colSpan={6} />
            )}
            {sortedAndFilteredNetworks.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id.substring(0, 12)}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.driver}</TableCell>
                <TableCell>{item.scope}</TableCell>
                <TableCell>{item.inUse ? "In use" : "Unused"}</TableCell>
                <TableCell className="text-right">
                  {!systemNetwoks.includes(item.name) && !item.inUse && (
                    <TableButtonDelete
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteNetworkConfirmation(item)
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
