import { useAuth } from "../../Context/AuthContext";
import { FormattedMessage } from "react-intl";
import {  type Dispatch, type SetStateAction } from "react";
import type { Locale } from "../../App";
import styles from "./Header.module.css";
import { useTheme } from "../../Theme/Theme";
interface Props {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
}

const Header = ({ locale, setLocale }: Props) => {
  const {  logout } = useAuth();
  const { toggleTheme, theme } = useTheme();

  return (
    <header className={styles.header}>
      {/* <div className={styles.left}>
        <div className={styles.logo}>HRMS</div>

        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.userEmail}>{user?.email}</span>
        </div>
      </div> */}
     
      <div className={styles.right}>
      
        <label className={styles.languageToggle}>
          <span style={{color: '#e5e7eb'}}>EN</span>

          <span className={styles.toggleTrack} >
            <input
              type="checkbox"
              checked={locale === "ja"}
              onChange={() =>
                setLocale(locale === "en" ? "ja" : "en")
              }
            />
            <span className={styles.toggleThumb} />
          </span>

          <span style={{color: '#e5e7eb'}}>JA</span>
        </label>
        
        <label className={styles.languageToggle}>
          <span style={{color: '#e5e7eb'}}>☀️ Light</span>

          <span className={styles.toggleTrack}>
            <input
              type="checkbox"
              checked={theme === "dark"}   
              onChange={toggleTheme} 
            />
            <span className={styles.toggleThumb} />
          </span>

          <span style={{color: '#e5e7eb'}}>🌙 Dark</span>
        </label>
        
        
        <button
          className={styles.logoutBtnFull}
          onClick={logout}
        >
          <FormattedMessage id="btn.logout" />
        </button>
      </div>
    </header>
  );
};

export default Header;