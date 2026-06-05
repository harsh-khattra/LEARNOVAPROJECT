import { useEffect, useState } from "react";
import EmployeeTable from "./Table";
import { SupabaseClient } from "../../Helper/Supabase";
import toast from "react-hot-toast";
import styles from "./Management.module.css";
import EmployeeForm from "./EmployeeForm";
import { Dialog } from "primereact/dialog";
export type Employee = {
  id: string;
  Name: string;
  Email: string;
  phone: string;
  role: string;
  department: string;
  avatar_url: string;
};

const Management = () => {
  const [employees, setEmployee] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(4);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<1 | -1 | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchData = async (page: number, limit: number) => {
    setLoading(true);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = SupabaseClient
      .from("employee_view")
      .select("*", { count: "exact" });

    if (filters.Name?.value)
      query = query.ilike("full_name", `%${filters.Name.value}%`);
    if (filters.Email?.value)
      query = query.ilike("Email", `%${filters.Email.value}%`);
    if (filters.role?.value)
      query = query.ilike("role", `%${filters.role.value}%`);
    if (filters.department?.value)
      query = query.ilike("department", `%${filters.department.value}%`);

    if (sortField && sortOrder !== null) {
      const fieldMap: Record<string, string> = {
        Name: "full_name",
        Email: "Email",
        phone: "phone",
        role: "role",
        department: "department",
      };

      query = query.order(fieldMap[sortField] ?? sortField, {
        ascending: sortOrder === 1,
      });
    }

    const { data, error, count } = await query.range(from, to);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const flat: Employee[] = data.map((emp: any) => ({
      id: emp.id,
      Name: emp.full_name,
      Email: emp.Email,
      phone: emp.phone,
      role: emp.role || "—",
      department: emp.department || "—",
      avatar_url: emp.avatar_url,
    }));

    setEmployee(flat);
    setTotalRecords(count || 0);
  };

  useEffect(() => {
    fetchData(page, limit);
  }, [page, limit, sortField, sortOrder, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortField, sortOrder]);

  const deleteEmployee = async (id: string) => {
    const { error } = await SupabaseClient
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Employee Deleted");
    fetchData(page, limit);
  };

  return (
    <div className={styles.tableWrapper}>

      {/*  SINGLE BUTTON */}
      <div className={styles.btnAndheading}>
        <button
          className={styles.addBtn}
          onClick={() => {
            setSelectedEmployee(null);
            setDialogMode("add");
          }}
        >
          + Add Employee
        </button>

        <h1 className={styles.title}>Employees Management</h1>
      </div>
      <EmployeeTable
        employees={employees}
        deleteEmployee={deleteEmployee}
        editEmployee={(emp) => {
          setSelectedEmployee(emp);
          setDialogMode("edit");
        }}
        viewEmployee={setViewEmployee}
        totalRecords={totalRecords}
        limit={limit}
        currentPage={page}
        loading={loading}
        onPageChange={(p, l) => {
          if (l !== limit) setPage(1);
          else setPage(p);
          setLimit(l);
        }}
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
        onFilterChange={(f) => setFilters(f)}
      />

      {/* VIEW MODAL*/}

      <Dialog
        header="Employee Details"
        visible={!!viewEmployee}
        style={{ width: "400px" }}
        onHide={() => setViewEmployee(null)}
      >
        {viewEmployee && (
          <div>
            <p><b>Name:</b> {viewEmployee.Name}</p>
            <p><b>Email:</b> {viewEmployee.Email}</p>
            <p><b>Phone:</b> {viewEmployee.phone}</p>
            <p><b>Department:</b> {viewEmployee.department}</p>
            <p><b>Role:</b> {viewEmployee.role}</p>

            <img
              src={viewEmployee.avatar_url}
              alt="avatar"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                objectFit: "cover",
                marginTop: "10px",
              }}
            />
          </div>
        )}
      </Dialog>
      {/* FINAL FORM */}
      <EmployeeForm
        visible={dialogMode !== null}
        mode={dialogMode || "add"}
        initialData={selectedEmployee}
        onClose={() => setDialogMode(null)}
        onSuccess={() => fetchData(page, limit)}
      />
    </div>
  );
};

export default Management;