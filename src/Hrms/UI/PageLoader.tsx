import Spinner from "./Spinner";
import styles from "./PageLoader.module.css";

const PageLoader = () => (
  <div className={styles.container}>
   <Spinner size="lg"/>
   <span className={styles.text}>Loading...</span>
  </div>
);

export default PageLoader;