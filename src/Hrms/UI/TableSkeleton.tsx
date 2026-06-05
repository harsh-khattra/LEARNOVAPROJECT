import styles from "./TableSkeleton.module.css";

interface TableSkeletonProps{
  rows?:number;
  cols?:number;
}

const TableSkeleton = ({rows = 5 , cols = 6}:TableSkeletonProps)=>{
 return (<div className={styles.wrapper}>
    {Array.from({length:rows}).map((_,i)=>(
      <div key={i} className={styles.row}>
        {Array.from({length:cols}).map((_,j)=>(
          <div key={j} className={styles.cell}/>
        ))}
        </div>
    ))}
  </div>)
}
export default TableSkeleton;