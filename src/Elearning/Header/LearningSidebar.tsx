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
  name: "CourseCompletion",
  path: "/learning/student/coursecompletion",
  icon: <FiHome />,
},
{
  name: "QuizPerformance",
  path: "/learning/student/quizperformance",
  icon: <FiHome />,
},
{
  name: "Timesspent",
  path: "/learning/student/timespent",
  icon: <FiHome />,
},
  ,
    {
      name: "My Courses",
      path: "/learning/student/courses",
      icon: <FiBookOpen />,
    },
    {
      name: "Enroll",
      path: "/learning/student/courseenrollment",
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
