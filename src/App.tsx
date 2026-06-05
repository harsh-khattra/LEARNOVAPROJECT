import { useLocation } from "react-router-dom";
import { useAuth } from "./Context/AuthContext";
import { Toaster } from "react-hot-toast";
import { useState} from "react";
import { IntlProvider } from "react-intl";
import "./App.css";
import en from "./languages/messages/en.json";
import ja from "./languages/messages/ja.json";
import AppRoutes from "./Routes/AppRoutes";

export type Locale = "en" | "ja";

const messages = { en, ja };

const App = () => {
  const [locale, setLocale] = useState<Locale>("en");

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <AppRoutes locale={locale} setLocale={setLocale}/>
      <Toaster position="top-right" reverseOrder={false} />
    </IntlProvider>
  );
};

export default App;
// import {
 
//   useLocation,
// } from "react-router-dom";
// import { useAuth } from "./Context/AuthContext";
// import { Toaster } from "react-hot-toast";
// import "./App.css";

// // import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
// import { useState } from "react";
// import {  IntlProvider } from "react-intl";
// import en from "./languages/messages/en.json";
// import ja from "./languages/messages/ja.json";
// import HrmsRoutes from "./Hrms/Router/HrmsRoutes";
// import Header from "./Hrms/Header/Header";
// import Sidebar from "./Hrms/Header/Sidebar";

// const messages = {
//   en,
//   ja,
// };

// export type Locale = "en" | "ja";

// const App = () => {
//   const { isAuth} = useAuth();
//   const location = useLocation();
//   const [locale, setLocale] = useState<Locale>("en");

//   const hideheaderRoutes = ["/login"];
//   const shouldHideHeader = hideheaderRoutes.includes(
//     location.pathname.toLowerCase(),
//   );
//   return (
//     <IntlProvider locale={locale} messages={messages[locale]}>
//       {!shouldHideHeader && isAuth ? (
//         <div className="mainLayout">
//        <Sidebar/>
//         <div className="appLayout">
          
//           <Header locale={locale} setLocale={setLocale}/>
//           <div className="content">
//             <HrmsRoutes/>
//           </div>
//         </div>
//        </div>
//       ):
//       ( <HrmsRoutes/>)}

//       <Toaster position="top-right" reverseOrder={false} />
//     </IntlProvider>
//   );
// };

// export default App;
