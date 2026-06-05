import { useCallback, useEffect, useMemo, useState } from "react";
import { SupabaseClient } from "../../Helper/Supabase";
import { type ColumnDef } from "@tanstack/react-table";
import toast from "react-hot-toast";
import styles from "./ShowTable.module.css";
import { useAuth } from "../../Context/AuthContext";

import TanstackTable, {
  DEFAULT_FILTERS,
  DEFAULT_DATE_PRESETS,
  type TableParams,
} from "../../SharedComponents/TanstackTable";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";

type Person = {
  Name: string;
  avatar_url: string;
  Email: string;
  start_date: string;
  end_date: string;
  total_days: string;
  reason: string;
  status: string;
  remarks: string | null;
  is_active?: boolean;
};

const ShowTable = () => {
  const intl=useIntl();
  const Navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [rows, setRows] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCount, setTotal] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchData = useCallback(
    async (params: TableParams) => {
      setLoading(true);
      try {
        const { page, pageSize, search, sortColumn, sortDirection,filterMode,dateRange } = params;
        const from = page * pageSize;
        const to = from + pageSize - 1;  
        const today = new Date().toISOString().split("T")[0];

        let query = SupabaseClient.from("employee_leave_view")
          .select("*", { count: "exact" })
          .order(sortColumn, { ascending: sortDirection === "asc" })
          .range(from, to);

          if(!permissions.dashboard && !permissions.management){
            query=query.eq("user_id",user?.id);
          }
          if(filterMode === "approved"){
            query = query.eq("status","approved").gte("start_date",today);
          }else if(filterMode === "pending"){
            query = query.eq("status","pending");
          }else if(filterMode === "rejected"){
            query = query.eq("status","rejected");
          }else if(filterMode === "past"){
            query=query.lt("start_date",today);
          }
          if(dateRange?.from) query=query.gte("start_date",dateRange.from);
          if(dateRange?.to) query= query.lte("start_date",dateRange.to);
        if (search) {
          query = query.or(`Name.ilike.%${search}%,Email.ilike.%${search}%`);
        }

        const { data, count, error } = await query;

        if (error) {
          toast.error(error.message);
        } else {
          setRows(data ?? []);
          setTotal(count ?? 0);
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    fetchData({
      page: 0,
      pageSize: 6,
      search: "",
      sortColumn: "created_at",
      sortDirection: "desc",
      filterMode:"all",
      dateRange:{from:"",to:""},
    });
  }, [user?.id]);

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "index",
        header:  intl.formatMessage({id:"table.sno"}) ,
        cell: ({ row }) => row.index + 1,
      },
      {
        id: "avatar",
        header:  intl.formatMessage({id:"table.avatar"}) ,
        cell: ({ row }) => (
          <img
            src={row.original.avatar_url}
            onClick={() => setSelectedImage(row.original.avatar_url)}
           className={styles.imageavatar}
          ></img>
        ),
      },
      { accessorKey: "Name", header: intl.formatMessage({id:"table.name"}) },
      { accessorKey: "Email", header:  intl.formatMessage({id:"table.email"})  },
      { accessorKey: "start_date", header:  intl.formatMessage({id:"table.startDate"})  },
      { accessorKey: "end_date", header: intl.formatMessage({id:"table.endDate"}) },
      { accessorKey: "total_days", header:  intl.formatMessage({id:"table.days"})  },
      { accessorKey: "reason", header:  intl.formatMessage({id:"table.reason"})  },
      {
        accessorKey: "status",
        header:  intl.formatMessage({id:"table.status"}) ,
        cell: ({ row }) => {
          const status = row.original.status;
          // const today = new Date().toISOString().split("T")[0];
         
          
          return (
            <span
              className={`${styles.status} ${
              
                   status === "approved"
                    ? styles.approved
                    : status === "rejected"
                      ? styles.rejected
                      : styles.pending
              }`}
            >
              { intl.formatMessage({id:`status.${status}`})}
            </span>
          );
        },
      },
      {
        accessorKey: "remark",
        header: intl.formatMessage({id:"table.title.remarks"}),
        cell: ({ row }) => {
          const remarks = row.original.remarks;
          return (
            <span className={styles.remarks}>{remarks ? remarks : "—"}</span>
          );
        },
      },
    ],
    [setSelectedImage,intl],
  );

  // const table = useReactTable({
  //   data: rows,
  //   columns,
  //   getCoreRowModel: getCoreRowModel(),
  // });
    const handleDownload = async () =>{
    if(!selectedImage) return;

    const res = await fetch(selectedImage);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `leave${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.container}>
     
      <div className={styles.header}>
        <button className={styles.backBtn} onClick ={()=>Navigate("/hrms/leave")}>←</button>
       <h2 className={styles.title}><FormattedMessage id="leave.myRequests"/></h2>
      </div>
      {/* {loading ? (
        <TableSkeleton rows={5} cols={8}></TableSkeleton>
      ) : (
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={styles.th}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={styles.tr}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={styles.td}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div> */}

      <TanstackTable
        data={rows}
        columns={columns}
        loading={loading}
        onParamsChange={fetchData}
        totalCount={totalCount}
        filters={DEFAULT_FILTERS}
        datePresets={DEFAULT_DATE_PRESETS}
      ></TanstackTable>
     {selectedImage && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <a
              onClick={handleDownload}
              className={styles.downloadBtn}
            >
              ⬇ Download
            </a>
            <img src={selectedImage} className={styles.modalImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowTable;
