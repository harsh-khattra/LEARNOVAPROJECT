import { Outlet } from "react-router-dom";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Header/Sidebar";
import type { Locale } from "../../App";

interface HrmsLayoutProps {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
}

const HrmsLayout = ({ locale, setLocale }: HrmsLayoutProps) => {
//   const [locale, setLocale] = useState<Locale>("en");
  const navigate = useNavigate();

  return (
    <div className="mainLayout">
      <Sidebar />
      <div className="appLayout">
        <Header locale={locale} setLocale={setLocale} />
        <div className="zone-switcher">
          <button onClick={() => navigate("/learning/dashboard")}>
            🎓 Switch to eLearning
          </button>
        </div>
        <div className="content">
          <Outlet />  
        </div>
      </div>
    </div>
  );
};

export default HrmsLayout;