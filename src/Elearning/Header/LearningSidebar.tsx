import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBookOpen,
  FiClipboard,
  FiAward,
  FiUser,
  FiMessageCircle,
  FiUsers,
  FiShield
} from "react-icons/fi";

import styles from "./LearningSidebar.module.css";

const LearningSidebar = () => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/learning/student/dashboard",
      icon: <FiHome />,
    },
    {
      name: "Upload Courses",
      path: "student/courses",
      //  Element:<CourseDashboardPage/> ,
      icon: <FiBookOpen />,
    },
     {
      name: "Courses Available",
      path: "employee/courses", 
      icon: <FiUsers />,
    },
    {
      name: "Admin Panel",
      path: "admin/approval-desk", 
      icon: <FiShield />,
    },
    {
      name: "Assignments",
      path: "/learning/student/assignments",
      icon: <FiClipboard />,
    },
    {
      name: "Certificates",
      path: "/learning/student/certificates",
      icon: <FiAward />,
    },
    {
      name: "Forum",
      path: "/learning/student/discussion",
      icon: <FiMessageCircle />,
    },
    {
      name: "My Profile",
      path: "/learning/student/profile",
      icon: <FiUser />,
    },
   
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? styles.activeLink : styles.link
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default LearningSidebar;
