import { NavLink } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f8f9fa",
      }}
    >
      <div
        style={{
          textAlign: "center",
          background: "#fff",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          width: "420px",
        }}
      >
        <h1
          style={{
            fontSize: "72px",
            margin: 0,
            color: "#dc3545",
          }}
        >
          403
        </h1>

        <h2>You are not authorized</h2>

        <p>
          Sorry! You don't have permission to access this page.
        </p>

        <NavLink
          to="/"
          style={{
            display: "inline-block",
            marginTop: "20px",
            padding: "10px 20px",
            background: "#007bff",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
          }}
        >
          Go to Dashboard
        </NavLink>
      </div>
    </div>
  );
};

export default Unauthorized;