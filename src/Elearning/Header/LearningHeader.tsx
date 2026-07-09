import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import styles from "./LearningHeader.module.css";
import logo from "../../assets/logo.png"// Adjust this path if your file is in a different folder

const LearningHeader: React.FC = () => {
  const navigate = useNavigate();

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

        <button className={styles.logoutBtn}>
          <FiLogOut />
        </button>
      </div>
    </header>
  );
};

export default LearningHeader;