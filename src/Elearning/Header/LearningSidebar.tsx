import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBookOpen,
  FiClipboard,
  FiAward,
  FiUser,
  FiMessageCircle,
  FiUsers,
  FiShield,
  FiCreditCard,
  FiBookmark,
} from "react-icons/fi";
import { useState ,useEffect} from "react";

import { useAuth } from "../../Context/AuthContext"; // Change path if needed
import styles from "./LearningSidebar.module.css";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const LearningSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

 useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.body.dataset.scrollY = String(scrollY);
  } else {
    const scrollY = Number(document.body.dataset.scrollY || 0);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollY);
  }

  return () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
  };
}, [isOpen]);

  const { user } = useAuth();
  console.log("Sidebar User:", user);
  console.log("Sidebar Role:", JSON.stringify(user?.role));

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      path: "/learning/student/landingPage",
      icon: <FiHome />,
      roles: ["Admin", "Teacher", "Student"],
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
      name: "Upload Courses",
      path: "/learning/teacher/courses",
      icon: <FiBookOpen />,
      roles: ["Admin", "Teacher"],
    },
    {
      name: "Courses Available",
      path: "/learning/student/courses",
      icon: <FiUsers />,
      roles: ["Admin", "Student"],
    },
    {
      name: "Saved Resources",
      path: "/learning/student/sandbox",
      icon: <FiBookmark />,
      roles: ["Admin", "Student"],
    },
    {
      name: "Admin Panel",
      path: "/learning/admin/approval-desk",
      icon: <FiShield />,
      roles: ["Admin"],
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
      roles: ["Admin", "Teacher", "Student"],
    },
    {
      name: "Certificates",
      path: "/learning/student/certificates",
      icon: <FiAward />,
      roles: ["Admin", "Teacher", "Student"],
    },
    {
      name: "Forum",
      path: "/learning/student/discussion",
      icon: <FiMessageCircle />,
      roles: ["Admin", "Teacher", "Student"],
    },
    {
      name: "Completion",
      path: "/learning/student/completion",
      icon: <FiClipboard />,
      roles: ["Student"],
    },
    {
      name: "Time Spent",
      path: "/learning/student/timespent",
      icon: <FiUser />,
      roles: ["Student"],
    },
    {
      name: "Enrolled",
      path: "/learning/student/enroll",
      icon: <FiCreditCard />,
      roles: ["Admin", "Teacher", "Student"],
    },
  ];



  const visibleMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  const formatEmail = (email: string) => {
  const index = email.indexOf("@gmail");

  if (index !== -1) {
    return email.substring(0, index + 6) + "...";
  }

  return email.length > 15 ? email.substring(0, 15) + "..." : email;
};
  return (
    <>
      <button className={styles.menuButton} onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>

    {isOpen && (
  <div
    className={styles.overlay}
    onClick={() => setIsOpen(false)}
  />
)}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <nav className={styles.nav}>
          {visibleMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `${isActive ? styles.activeLink : styles.link} ${
                  item.name === "My Profile" ? styles.spaced : ""
                }`
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        
        {user && (
          <div className={styles.profileSection}>
            <div className={styles.profileIcon}>
              <FiUser size={20} />
            </div>
            <div className={styles.profileText}>
              <span className={styles.profileGreeting}>Hi, {user.role}</span>
             <span className={styles.profileEmail}>
  {formatEmail(user.email)}
</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default LearningSidebar;