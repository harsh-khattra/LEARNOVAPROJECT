import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { useAuth } from "../../Context/AuthContext"; // adjust path to match this file's location
import styles from "./LearningHeader.module.css";
import logo from "../../assets/logo.png"// Adjust this path if your file is in a different folder

const LearningHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

 const handleLogout = () => {
  const confirmed = window.confirm(
    "Are you sure you want to logout?"
  );

  if (!confirmed) return;

  logout();
  navigate("/");
};

  return (
    <header className={styles.header}>
      <div className={styles.logoSection}>
        <img src={logo} alt="Learnova Logo" className={styles.logoImage} />
        <span className={styles.logoMain}>LEARNOVA</span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.switchBtn}
          onClick={() => navigate("/hrms/dashboard")}
        >
          Switch to HRMS
        </button>

        <button className={styles.logoutBtnFull} onClick={handleLogout}>
          <FiLogOut />
          <FormattedMessage id="btn.logout" />
        </button>
      </div>
    </header>
  );
};

export default LearningHeader;