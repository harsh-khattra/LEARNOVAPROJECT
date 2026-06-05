import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { type Employee } from "./Management";
import styles from "./Management.module.css"; 
// import { href } from "react-router-dom";
import toast from "react-hot-toast";

type Props = {
  employees: Employee[];
  deleteEmployee: (id: string) => void;
  editEmployee: (emp: Employee) => void;
  viewEmployee: (emp: Employee) => void;
  totalRecords: number;
  onPageChange: (page: number, limit: number) => void;
  limit: number;
  currentPage: number;
  loading: boolean;
  onSortChange: (field: string, order: 1 | -1) => void;
  onFilterChange: (filters: any) => void;
};

const EmployeeTable: React.FC<Props> = ({
  employees,
  deleteEmployee,
  editEmployee,
  viewEmployee,
  totalRecords,
  onPageChange,
  limit,
  currentPage,
  loading,
  onSortChange,
  onFilterChange,
}) => {
  const [filtersState, setFiltersState] = useState<any>({
    Name: { value: null, matchMode: "contains" },
    Email: { value: null, matchMode: "contains" },
    department: { value: null, matchMode: "contains" },
    role: { value: null, matchMode: "contains" },
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [localSortOrder, setLocalSortOrder] = useState<1 | -1>(1);
  const [sortFieldLocal, setSortFieldLocal] = useState<string | null>(null);


  //theme for table 
  
  useEffect(() => {
    const themeId = "primereact-theme-link";
  
    const applyTheme = () => {
      const isDark = localStorage.getItem("theme") === "dark";
  
      let link = document.getElementById(themeId) as HTMLLinkElement;
  
      if (!link) {
        link = document.createElement("link");
        link.id = themeId;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
  
      link.href = isDark
        ? "/node_modules/primereact/resources/themes/lara-dark-blue/theme.css"
        : "/node_modules/primereact/resources/themes/lara-light-blue/theme.css";
    };
  
    applyTheme();
  
    window.addEventListener("theme-change", applyTheme);
  
    return () => {
      window.removeEventListener("theme-change", applyTheme);
    };
  }, []);
  // Sorting
const handleManualSort = (field: string) => {
  let newOrder: 1 | -1 = 1;

  if (sortFieldLocal === field) {
    newOrder = localSortOrder === 1 ? -1 : 1;
  }

  setSortFieldLocal(field);
  setLocalSortOrder(newOrder);

  onSortChange(field, newOrder);
};

  // Pagination
  const handlePage = (event: any) => {
    const newPage = event.page + 1;
    const newLimit = event.rows;
    onPageChange(newPage, newLimit);
  };

  // Action buttons
  const actionBody = (rowData: Employee) => {

    if (!rowData.id || rowData.id === "empty") return null;

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <Button
        label="View"
        icon="pi pi-eye"
        className="p-button-info"
        onClick={() => viewEmployee(rowData)}
      />
      <Button
        label="Edit"
        icon="pi pi-pencil"
        className="p-button-warning"
        onClick={() => editEmployee(rowData)}
      />
      <Button
        label="Delete"
        icon="pi pi-trash"
        className="p-button-danger"
        onClick={() => deleteEmployee(rowData.id)}
      />
    </div>
  );
  };
  // Avatar click 
 const avatarBody = (rowData: Employee) => {
  if (!rowData.avatar_url) return null;   

  

  return (
  
    <img
      src={rowData.avatar_url}
      alt={rowData.Name}
       className={styles.avatar} 
      onClick={() => setPreviewImage(rowData.avatar_url)}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "2px solid #ddd",
        cursor: "pointer",
      }}
    />
  );
};

  // return (
  //   <div className={styles.tableWrapper}>
  //   {loading ? (
  //       <div className={styles["custom-loader"]}>
  //         <div className={styles.spinner}></div>
  //         <p>Loading employees...</p>
  //       </div>
  //     ) : (
  //       <DataTable
  //         value={employees}
  //         paginator
  //         rows={limit}
  //         first={(currentPage - 1) * limit}
  //         totalRecords={totalRecords}
  //         rowsPerPageOptions={[2, 4, 6]}
  //         filterDisplay="row"
  //         filters={filtersState}
  //         sortMode="single"
  //         loading={false} 
  //         lazy
  //         scrollHeight="flex" 
  //         onPage={handlePage}
  //         onFilter={(e) => {
  //           setFiltersState(e.filters);
  //           onFilterChange(e.filters);
  //         }}
  //       >
const filledEmployees = [
  ...employees,
  ...Array.from(
    { length: Math.max(0, limit - employees.length) }, 
    (_, i) => ({
      id: `empty-${i}`,
      Name: "",
      Email: "",
      phone: "",
      role: "",
      department: "",
      avatar_url: null,
    })
  )
];
   const handleDownload = async(url:string ) =>{
    try{
      const response = await fetch(url);
      const blob = await response.blob();
       
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "employee-image.jpg";
      link.click();

      toast.success("Image download");}
      catch(error){
        toast.error("Download failed");
      }
    }
   
return (
  <div className={styles.tableContainer}>

    {loading ? (
      <div className={styles.skeletonWrapper}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            
            {/* Avatar */}
            <div className={styles.skeletonAvatar}></div>

            {/* 5 Columns */}
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>

          </div>
        ))}
      </div>
    ) : (
      <DataTable
        value={filledEmployees}
        paginator
        rows={limit}
        first={(currentPage - 1) * limit}
        totalRecords={totalRecords}
        rowsPerPageOptions={[2,4,6]}
        filterDisplay="row"
        filters={filtersState}
        sortMode="single"
        tableStyle={{ minHeight: "480px" }}
        lazy
        loading={false}
        onPage={handlePage}
        onFilter={(e) => {
          setFiltersState(e.filters);
          onFilterChange(e.filters);
        }}
        paginatorRight={
          <span className={styles.totalCount}>
            Total Employees: {totalRecords}
          </span>
        }
      >

        <Column header="Avatar" body={avatarBody} />

        <Column
          field="Name"
          header={
            <span
              style={{ cursor: "pointer", display: "flex", gap: "5px", alignItems: "center" }}
              onClick={() => handleManualSort("full_name")}
            >
              Name
              {sortFieldLocal !== "full_name" && <i className="pi pi-sort-alt" />}
              {sortFieldLocal === "full_name" && (
                <i className={`pi ${localSortOrder === 1 ? "pi-sort-up" : "pi-sort-down"}`} />
              )}
            </span>
          }
          filter
          filterPlaceholder="Search Name"
          showFilterMenu={false}
        />

        <Column
          field="Email"
          header={
            <span
              style={{ cursor: "pointer", display: "flex", gap: "5px", alignItems: "center" }}
              onClick={() => handleManualSort("Email")}
            >
              Email
              {sortFieldLocal !== "Email" && <i className="pi pi-sort-alt" />}
              {sortFieldLocal === "Email" && (
                <i className={`pi ${localSortOrder === 1 ? "pi-sort-up" : "pi-sort-down"}`} />
              )}
            </span>
          }
          filter
          filterPlaceholder="Search Email"
          showFilterMenu={false}
        />

        <Column
          field="department"
          header={
            <span
              style={{ cursor: "pointer", display: "flex", gap: "5px", alignItems: "center" }}
              onClick={() => handleManualSort("department")}
            >
              Department
              {sortFieldLocal !== "department" && <i className="pi pi-sort-alt" />}
              {sortFieldLocal === "department" && (
                <i className={`pi ${localSortOrder === 1 ? "pi-sort-up" : "pi-sort-down"}`} />
              )}
            </span>
          }
          filter
          filterPlaceholder="Search Department"
          showFilterMenu={false}
        />

        <Column
          field="role"
          header={
            <span
              style={{ cursor: "pointer", display: "flex", gap: "5px", alignItems: "center" }}
              onClick={() => handleManualSort("role")}
            >
              Role
              {sortFieldLocal !== "role" && <i className="pi pi-sort-alt" />}
              {sortFieldLocal === "role" && (
                <i className={`pi ${localSortOrder === 1 ? "pi-sort-up" : "pi-sort-down"}`} />
              )}
            </span>
          }
          filter
          filterPlaceholder="Search Role"
          showFilterMenu={false}
        />

        <Column header="Actions" body={actionBody} />

      </DataTable>
    )}

   
    <Dialog
      visible={!!previewImage}
      onHide={() => setPreviewImage(null)}
      style={{ width: "auto" }}
      header={
        <div className={styles.dialogHeader}>
          <span>Image Preview</span>

          {previewImage && (
            <i
              className={`pi pi-download ${styles.downloadIcon}`}
              onClick={() => handleDownload(previewImage)}
              title="Download Image"
            />
          )}
        </div>
      }
    >
      {previewImage && (
        <div style={{ textAlign: "center" }}>
          <img
            src={previewImage}
            alt="preview"
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "10px",
              objectFit: "cover",
            }}
          />
        </div>
      )}
    </Dialog>

  </div>
);}
export default EmployeeTable;