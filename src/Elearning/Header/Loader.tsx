import React from "react";
import styles from "./Loader.module.css";
import logo from "../../assets/logo.png";

const Loader: React.FC = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}>
          <img
            src={logo}
            alt="Learnova"
            className={styles.logo}
          />
        </div>

        <h2 className={styles.title}>LEARNOVA</h2>

        <p className={styles.subtitle}>
         LEARN.GROW.NOVA
        </p>
      </div>
    </div>
  );
};

export default Loader;