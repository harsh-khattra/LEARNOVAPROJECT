import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBookOpen,
  FiClipboard,
  FiAward,
  FiUser,
  FiMessageCircle,
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
      name: "My Courses",
      path: "/learning/student/courses",
      icon: <FiBookOpen />,
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
    
    {
      name: "Quiz",
      path: "/learning/student/quiz",
      icon: <FiUser />,
    },
    {
      name: "Completion",
      path: "/learning/student/completion",
      icon: <FiUser />,
    },
    {
      name: "Timespent",
      path: "/learning/student/timespent",
      icon: <FiUser />,
    }
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
