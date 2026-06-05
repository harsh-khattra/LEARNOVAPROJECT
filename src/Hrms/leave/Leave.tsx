import { useNavigate } from "react-router-dom";
import styles from "./leave.module.css";
import { useAuth } from "../../Context/AuthContext";
import { FormattedMessage } from "react-intl";



const Leave = ()=> {
  const{permissions}=useAuth();
  
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h2><FormattedMessage id="heading.name"/></h2>

      <div className={styles.cardContainer}>
        
       { permissions.applyLeave &&<div
          className={styles.card} 
          onClick={() => navigate("/hrms/applyleave")}
        >
          <h3><FormattedMessage id="leave.apply"/></h3>
        </div>}

       {permissions.approveLeave && <div
          className={styles.card}
          onClick={() => navigate("/hrms/approveleave")}
        >
          <h3><FormattedMessage id ="leave.approve"/></h3>
        </div>}

     {permissions.leaveTable &&   <div
          className={styles.card}
          onClick={() => navigate("/hrms/leavetable")}
        >
          <h3><FormattedMessage id="leave.table"/></h3>
        </div>}

      </div>
    </div>
  );
};

export default Leave;