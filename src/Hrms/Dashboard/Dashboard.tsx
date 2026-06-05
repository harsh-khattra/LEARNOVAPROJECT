import { useEffect, useState, useRef, useCallback } from "react";
import styles from "./dashboard.module.css";
import { Button } from "primereact/button";
// import { InputSwitch } from "primereact/inputswitch";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, ResponsiveContainer, Pie, Cell,
} from "recharts";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { SupabaseClient } from "../../Helper/Supabase";
import { Dialog } from "primereact/dialog";

type SortField = "Name" | "Email" | "Department" | "Role";
type SortOrder = "asc" | "desc";

const Dashboard = () => {
  // const [isDark, setIsDark] = useState(false);
  const [search, setSearch] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [Page, setPage] = useState(1);
  const [limit, setLimit] = useState(3);
  const [employees, setEmployees] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>("Name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [status, setStatus] = useState({ total: 0, leaves: 0, pending: 0 , Departmenttotal: 0, totalRoles: 0,});
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");


  const [departmentCount, setDepartmentCount] = useState<Record<string, number>>({});

 const [roleCount, setRoleCount] = useState<Record<string, number>>({}); 
  const isFirstRender = useRef(true);
  const skipPageEffect = useRef(false);


const handleDownload = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "profile-photo.jpg";
    link.click();
  };

  // useEffect(() => {
  //   document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  // }, [isDark]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(searchEmail), 400);
    return () => clearTimeout(t);
  }, [searchEmail]);

  async function fetchStatus() {
   
    const { data: leaveData } = await SupabaseClient
      .from("leave_requests")
      .select("status");

    
    const { count } = await SupabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true });


    const { data, error } = await SupabaseClient
  .from("employee_view")
  .select('department, role');

if (error) {
  console.log(error);
  return;
}

// Department ka count
const departmentCount = data.reduce((acc, row) => {
  acc[row.department] = (acc[row.department] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const DepartmentCount = Object.values(departmentCount).reduce((sum, count) => sum + count, 0);
console.log("DEPARTMENT KA TOTAL COUNT:", DepartmentCount); 


// Role ka count
const roleCount = data.reduce((acc, row) => {
  acc[row.role] = (acc[row.role] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const RoleCount=Object.values(roleCount).reduce((sum,count)=>sum+count,0)
console.log("ROLE KA TOTAL COUNT:", RoleCount);

setDepartmentCount(departmentCount);  // yeh line missing thi
setRoleCount(roleCount);      

    if (leaveData) {
      setStatus({
        total: count || 0,
        leaves: leaveData.filter((e) => e.status === "approved").length,
        pending: leaveData.filter((e) => e.status === "pending").length,
        Departmenttotal:DepartmentCount , totalRoles: RoleCount,
      });
    }
  }

  const fetchEmployees = useCallback(async (page: number, rowLimit: number) => {
    setLoading(true);
    let query = SupabaseClient.from("employee_view").select("*", { count: "exact" });
    if (debouncedSearch) query = query.ilike("full_name", `%${debouncedSearch}%`); // ✅ FIX 4: Missing % wildcards
    if (debouncedEmail) query = query.ilike("Email", `%${debouncedEmail}%`);
    if (departmentFilter) query = query.ilike("department", `%${departmentFilter}%`);
    if (roleFilter) query = query.ilike("role", `%${roleFilter}%`);
    if (sortField === "Name") query = query.order("full_name", { ascending: sortOrder === "asc" });
    else if (sortField === "Email") query = query.order("Email", { ascending: sortOrder === "asc" });
    else if (sortField === "Department") query = query.order("department", { ascending: sortOrder === "asc" });
    else if (sortField === "Role") query = query.order("role", { ascending: sortOrder === "asc" });
    const from = (page - 1) * rowLimit;
    query = query.range(from, from + rowLimit - 1);
    const { data, error, count } = await query;
    if (error) { console.error(error); setLoading(false); return; }
    setEmployees((data || []).map((item: any) => ({
      Name: item.full_name,
      Email: item.Email,
      role: item.role,
      department: item.department,
      Preview: item.avatar_url,
    })));
    setTotalCount(count || 0);
    setLoading(false);
  }, [debouncedSearch, debouncedEmail, departmentFilter, roleFilter, sortField, sortOrder]);

  useEffect(() => { fetchStatus(); fetchEmployees(1, limit); }, []);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    skipPageEffect.current = true;
    setPage(1);
    fetchEmployees(1, limit);
  }, [fetchEmployees]);

  useEffect(() => {
    if (isFirstRender.current) return;
    if (skipPageEffect.current) { skipPageEffect.current = false; return; }
    fetchEmployees(Page, limit);
  }, [Page, limit]);



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

  const chartData = [
    { name: "Total", value: status.total },
    { name: "Approved", value: status.leaves },
    { name: "Pending", value: status.pending },
  ];


 const roleData=[
     { name: "Business Analyst", value:roleCount["Business Analyst"]  },
     { name: "DevOps",  value:roleCount["DevOps"]  },
     {  ame: "Frontend Developer", value: roleCount["Frontend Developer"] },
     { name: "Full Stack", value:roleCount["Full Stack"]   },
    { name: "mainAdmin", value:roleCount["mainAdmin"] },
     { name: "subManager1", value:roleCount["subManager1"]  },
   ]

  
  const chartData34 = [
    { name: "HR", value: departmentCount["HR"] || 0 },
    { name: "MainAdmin", value: departmentCount["MainAdmin"] || 0 },
    { name: "CloudSvc", value: departmentCount["CloudSvc"] || 0 },
    { name: "Manager2", value: departmentCount["Manager2"] || 0 },
    { name: "ITStrac", value: departmentCount["ITStrac"] || 0 },
    { name: "TechOps", value: departmentCount["TechOps"] || 0 },
  ];

  function handleSort(field: SortField) {
    if (sortField === field) setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>⇅</span>;
    return <span>{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const PreviewHeader = (
    <div style={{ textAlign: "center", fontWeight: "bold", color: "var(--text-primary)", marginTop: "-30px" }}>
      Profile Photo
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: "#fff", border: "1px solid #e0e0e0",
          borderRadius: "8px", padding: "10px 16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          <p style={{ margin: "0 0 6px 0", fontWeight: "bold", color: "#333", fontSize: "14px" }}>
            {label}
          </p>
          <p style={{ margin: 0, color: "#1e88e5", fontSize: "13px" }}>
            Count: <strong>{payload[0].value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const nameHeader = (
    <>
      <div onClick={() => handleSort("Name")}>Name <SortIcon field="Name" /></div>
      <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name" />
    </>
  );

  const emailHeader = (
    <>
      <div onClick={() => handleSort("Email")}>Email <SortIcon field="Email" /></div>
      <InputText value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Search Email" />
    </>
  );

  const deptHeader = (
    <>
      <div onClick={() => handleSort("Department")}>Department <SortIcon field="Department" /></div>
      <InputText value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} placeholder="Search Department" />
    </>
  );

  const roleHeader = (
    <>
      <div onClick={() => handleSort("Role")}>Role <SortIcon field="Role" /></div>
      <InputText value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} placeholder="Search Role" />
    </>
  );

  const imageBody = (rowData: any) => (
    <img
      src={rowData.Preview} alt="profile"
      style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
      referrerPolicy="no-referrer"
      onClick={() => { setSelectedImage(rowData.Preview); setVisible(true); }}
    />
  );

  const PIE_COLORS_1 = ["#0088FE", "#00C49F", "#FF8042"];
  const PIE_COLORS_2 = ["#0088FE", "#00C49F", "#8442ff", "#42ffd0", "#42c6ff", "#ffe042"];

  return (
    <div className={styles.dashboard}>
      

      <Dialog visible={visible} onHide={() => setVisible(false)} header="Profile Photo">
        <img src={selectedImage} alt="Profile Big"
          style={{ width: "350px", height: "350px", objectFit: "cover", borderRadius: "10px" }}
          referrerPolicy="no-referrer"
        />
        <div style={{ textAlign: "center", marginTop: "12px" }}>
    {/* ✅ PrimeReact Button */}
    <Button
      label="Download"
      icon="pi pi-download"
      onClick={() => handleDownload(selectedImage)}
      severity="info"
      rounded
    />
  </div>
        
      </Dialog>

      <div className={styles.cards}>
        <div>Total Employees: {status.total}</div>
        <div>Approved Leaves: {status.leaves}</div>
        <div>Pending: {status.pending}</div>
        <div>Department: {status.Departmenttotal}</div>
        <div>Role: {status.totalRoles}</div>
      </div>

      <div className={styles.charts}>
        {/* Bar Chart */}
        <ResponsiveContainer width="50%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="blue" />
          </BarChart>
        </ResponsiveContainer>

       
        <ResponsiveContainer width="50%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS_1[index % PIE_COLORS_1.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="70%" height={300}>
          <PieChart>
            <Pie data={chartData34} dataKey="value" nameKey="name" outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}>
              {chartData34.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS_2[index % PIE_COLORS_2.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="70%" height={300}>
          <PieChart>
            <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}>
              {roleData.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS_2[index % PIE_COLORS_2.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <DataTable
        value={employees} loading={loading}
        paginator rows={limit} rowsPerPageOptions={[3, 4, 5]}
        totalRecords={totalCount} lazy
        first={(Page - 1) * limit}
        onPage={(e) => {
          if (e.rows !== limit) { setLimit(e.rows); setPage(1); }
          else { setPage(e.page! + 1); }
        }}
      >
        <Column field="Preview" header={PreviewHeader} body={imageBody} />
        <Column field="Name" header={nameHeader} />
        <Column field="Email" header={emailHeader} />
        <Column field="department" header={deptHeader} />
        <Column field="role" header={roleHeader} />
      </DataTable>
    </div>
  );
};

export default Dashboard;