import { useFormik } from "formik";

import styles from "./ShowForm.module.css";
import * as Yup from "yup";
import { SupabaseClient } from "../../Helper/Supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { FormattedMessage, useIntl } from "react-intl";

const ShowForm = () => {
  const intl = useIntl();
  const Navigate = useNavigate();
  const { user } = useAuth();
  const navigate = useNavigate();

  const calculateWorkingDays = (start: string, end: string) => {
    if (!start || !end) return "";

    let count = 0;
    let current = new Date(start);
    const last = new Date(end);

    while (current <= last) {
      const day = current.getDay();

      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count.toString();
  };

  const formik = useFormik({
    initialValues: {
      startDate: "",
      endDate: "",
      total_day: "",
      reason: "",
      leave_type: "",
    },
    validationSchema: Yup.object({
      startDate: Yup.date()
        .required(intl.formatMessage({id:"validation.startRequired"}))
        .min(new Date(), intl.formatMessage({id:"validation.startFuture"})),
      endDate: Yup.date()
        .required(intl.formatMessage({id:"validation.endRequired"}))
        .test(
          "is-after-start",
           intl.formatMessage({id:"validation.endAfterStart"}),
          function (value) {
            const { startDate } = this.parent;
            return value && startDate
              ? new Date(value) > new Date(startDate)
              : true;
          },
        ),
      total_day: Yup.string().required(intl.formatMessage({id:"validation.totalDaysRequired"})),
      leave_type: Yup.string().required(intl.formatMessage({id:"validation.typeRequired"})),
      reason: Yup.string().required(intl.formatMessage({id:"validation.reasonRequired"})),
    }),
   onSubmit: async (values) => {
  try {
    const startDate = new Date(values.startDate)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(values.endDate)
      .toISOString()
      .split("T")[0];

  
    const { data: overlapping, error: overlapError } =
      await SupabaseClient.from("leave_requests")
        .select("start_date, end_date, status")
        .eq("user_id", user?.id)
        .in("status", ["pending", "approved"])
        .lte("start_date", endDate)
        .gte("end_date", startDate);

    if (overlapError) {
      toast.error("Could not validate dates");
      return;
    }

    if (overlapping && overlapping.length > 0) {
      const conflict = overlapping[0];
      toast.error(
        `You already have a leave from ${conflict.start_date} to ${conflict.end_date} (${conflict.status})`
      );
      return;
    }

   
    const { data: leaveType } =
      await SupabaseClient.from("leave_types")
        .select("id")
        .eq("Leave_Type_Name", values.leave_type)
        .maybeSingle();

    if (!leaveType?.id) {
      toast.error("Invalid leave type");
      return;
    }

    const { error: err } = await SupabaseClient.from("leave_requests").insert([
      {
        user_id: user?.id,
        Name: user?.name,
        Email: user?.email,
        leave_type_id: leaveType.id,
        department_id: user?.deptId,
        start_date: startDate,
        end_date: endDate,
        total_days: values.total_day,
        reason: values.reason,
        status: "pending", 
      },
    ]);

    if (err) {
      toast.error(err.message);
      return;
    }

    toast.success("Leave applied successfully");
    navigate("/hrms/leavetable");
    formik.resetForm();
  } catch (err) {
    console.log(err);
    toast.error("Something went wrong");
  }
  },});

  useEffect(() => {
    const { startDate, endDate } = formik.values;
    if (startDate && endDate) {
      const days = calculateWorkingDays(startDate, endDate);
      formik.setFieldValue("total_day", days);
    }
  }, [formik.values.startDate, formik.values.endDate]);

  return (
    <div className={styles.fullpage}>
      <div className={styles.headers}>
        <button className={styles.backBtn} onClick ={()=>Navigate("/hrms/leave")}>←</button>
      <h2 className={styles.title}><FormattedMessage id="nav.applyLeave"/></h2>
      </div>
      <form onSubmit={formik.handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <span><FormattedMessage id="leave.application"/></span>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label><FormattedMessage id="leave.startDate"/></label>
            <input
              type="date"
              name="startDate"
              value={formik.values.startDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.startDate && formik.errors.startDate && (
              <span className={styles.error}>{formik.errors.startDate}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label><FormattedMessage id="leave.endDate"/></label>
            <input
              type="date"
              name="endDate"
              value={formik.values.endDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.endDate && formik.errors.endDate && (
              <span className={styles.error}>{formik.errors.endDate}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label><FormattedMessage id="leave.totalDays"/></label>
            <input
              type="text"
              name="total_day"
              value={formik.values.total_day}
              readOnly
              disabled
            />
            {formik.touched.total_day && formik.errors.total_day && (
              <span className={styles.error}>{formik.errors.total_day}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label><FormattedMessage id="leave.type"/></label>
            <select
              name="leave_type"
              value={formik.values.leave_type}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value=""><FormattedMessage id="leave.selectType"/></option>
              <option value="Maternity Leave"><FormattedMessage id="leave.type.maternity"/></option>
              <option value="Earned Leave"><FormattedMessage id="leave.type.earned"/></option>
              <option value="Casual Leave"><FormattedMessage id="leave.type.casual"/></option>
              <option value="Sick Leave"><FormattedMessage id="leave.type.sick"/></option>
              <option value="Unpaid Leave"><FormattedMessage id="leave.type.unpaid"/></option>
            </select>

            {formik.touched.leave_type && formik.errors.leave_type && (
              <span className={styles.error}>{formik.errors.leave_type}</span>
            )}
          </div>

          <div className={styles.inputGroupFull}>
            <label><FormattedMessage id="leave.reason"/></label>
            <textarea
              name="reason"
              placeholder={intl.formatMessage({id:"leave.reason.placeholder"})}
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.reason && formik.errors.reason && (
              <span className={styles.error}>{formik.errors.reason}</span>
            )}
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>
          <FormattedMessage id="leave.apply"/>
        </button>
      </form>
    </div>
  );
};

export default ShowForm;
