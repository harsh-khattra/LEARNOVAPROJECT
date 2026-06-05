 import styles from "./Spinner.module.css";

type SpinnerSize = "sm"|"md"|"lg";
interface SpinnerProps{
  size?:SpinnerSize;
  color?:"default"|"success"|"danger";
}

const Spinner = ({size="md",color="default"}:SpinnerProps)=>{
  return(
    <div className={`${styles.spinner}${styles[size]} ${styles[color]}`}></div>
  );
};

export default Spinner;