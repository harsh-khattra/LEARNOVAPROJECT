import { Outlet } from "react-router-dom";
import LearningSidebar from "../Header/LearningSidebar";
import LearningHeader from "../Header/LearningHeader";

import styles from "./LearningLayout.module.css";

const ElearningLayout = () => {
  return (
    <div className={styles.layout}>
      <LearningHeader />

      <div className={styles.body}>
        <LearningSidebar />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ElearningLayout;
