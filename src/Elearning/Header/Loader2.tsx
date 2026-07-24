import { motion} from "framer-motion";
import "./Loader2.css";

import Logo from "../../assets/image.svg?react";
export default function Loader2 () {
 

  return (
    
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
          }}
          transition={{
            duration: 0.8,
          }}
        >
          <div className="backgroundGradient" />

          <motion.div
            className="glow"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />

          <motion.div
            className="logoWrapper"
            animate={{
              scale: [1, 1.03, 1],
              rotate: [0, 1, 0, -1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <Logo className="logo" />
            <div className="shine"></div>
          </motion.div>
 <motion.h2
  className="tagline"
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{
    duration: 2,
    repeat: Infinity,
  }}
>
  <span>LEARN.</span>
  <span>GROW.</span>
  <span>NOVA.</span>
</motion.h2>
          <motion.h2
            className="title"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            Preparing Learnova...
          </motion.h2>

          <LoadingDots />
        </motion.div>
      )}
  



function LoadingDots() {
  return (
    <div className="dots">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{
            y: [0, -8, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.2,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
}
