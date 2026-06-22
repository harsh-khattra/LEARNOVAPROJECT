import { useState, useEffect } from "react";
// import "./Courseenrollment .css";
import { SupabaseClient } from "../../Helper/Supabase";

interface AlsoBought {
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  rating: number;
  hours: string;
  students: string;
  price: string;
  oldPrice: string;
}

const defaultExtras: Omit<AlsoBought, "title">[] = [
  { icon: "⚛", iconBg: "#E6F1FB", iconColor: "#185FA5", rating: 4.8, hours: "28h", students: "32,400 students", price: "₹499", oldPrice: "₹2,999" },
  { icon: "🖥", iconBg: "#EAF3DE", iconColor: "#3B6D11", rating: 4.7, hours: "22h", students: "18,200 students", price: "₹399", oldPrice: "₹1,999" },
  { icon: "🎨", iconBg: "#EEEDFE", iconColor: "#534AB7", rating: 4.6, hours: "18h", students: "14,800 students", price: "₹349", oldPrice: "₹1,799" },
  { icon: "🗄", iconBg: "#F1EFE8", iconColor: "#5F5E5A", rating: 4.5, hours: "16h", students: "9,600 students", price: "₹299", oldPrice: "₹1,499" },
];

const CourseEnrollment = () => {
  const [cartItems, setCartItems] = useState<number[]>([]);
  const [alsoBoughtData, setAlsoBoughtData] = useState<AlsoBought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 const [titles, setTitles] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const { data, error } = await SupabaseClient
        .from("courses")
        .select("title");
       setTitles(data || []);

      console.log("DATA", data);

      if (error) {
        setError(error.message);
      } else {
        const merged: AlsoBought[] = (data || []).map(
          (course: { title: string }, index: number) => ({
            title: course.title,
            ...defaultExtras[index % defaultExtras.length],
          })
        );
        setAlsoBoughtData(merged);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const handleAddToCart = (index: number) => {
    setCartItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const renderStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "½" : "");
  };

  return (
    <div className="ce-page">

      {/* Hero */}
      <div className="ce-hero">
        <div className="ce-hero-icon">
          <span>🐍</span>
        </div>
        <div className="ce-hero-info">
         <h1 className="ce-hero-title">{titles[0]?.title}</h1>
          <p className="ce-hero-sub">Master Python, Pandas, NumPy and scikit-learn</p>
          <div className="ce-hero-stats">
            <span className="ce-stat">⭐ 4.9</span>
            <span className="ce-stat">👥 51,000 students</span>
            <span className="ce-stat">🕐 36h</span>
            <span className="ce-stat">🏅 Certificate</span>
          </div>
        </div>
      </div>

      {/* Price card */}
      <div className="ce-card">
        <div className="ce-price-row">
          <span className="ce-price">₹599</span>
          <span className="ce-price-old">₹3,499</span>
          <span className="ce-disc-badge">83% off</span>
        </div>
        <button className="ce-btn-enroll">Enroll now</button>
        <button className="ce-btn-wish">
          <span>♡</span> Add to wishlist
        </button>
        <div className="ce-includes">
          <div className="ce-inc-row">
            <span className="ce-inc-icon">📹</span> On-demand video lectures
          </div>
          <div className="ce-inc-row">
            <span className="ce-inc-icon">📁</span> Downloadable resources
          </div>
          <div className="ce-inc-row">
            <span className="ce-inc-icon">∞</span> Lifetime access
          </div>
          <div className="ce-inc-row">
            <span className="ce-inc-icon">🏆</span> Certificate of completion
          </div>
        </div>
        <div className="ce-money-back">♡ 30-day money-back guarantee</div>
      </div>

      {/* What you'll learn */}
      {/* What you'll learn */}
<div className="ce-card">
  <h2 className="ce-section-title">What you will learn</h2>
  <div className="ce-learn-grid">
    <div className="ce-learn-item"><span className="ce-check">✓</span> React Basics & JSX</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> Components & Props</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> useState & useEffect</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> React Router DOM</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> Context API & Redux</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> API Integration</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> Custom Hooks</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> Performance Optimization</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> React Query</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> Testing with RTL</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> TypeScript with React</div>
    <div className="ce-learn-item"><span className="ce-check">✓</span> Real Project Deployment</div>
  </div>
</div>

      {/* Students also bought */}
      <div className="ce-card">
        <h2 className="ce-section-title">Students also bought</h2>

        {loading && (
          <div className="ce-loading">Loading courses...</div>
        )}

        {error && (
          <div className="ce-error">Failed to load courses: {error}</div>
        )}

        {!loading && !error && alsoBoughtData.length === 0 && (
          <div className="ce-empty">No courses found.</div>
        )}

        <div className="ce-also-list">
          {alsoBoughtData.map((course, index) => (
            <div key={index} className="ce-also-item">
              <div
                className="ce-also-thumb"
                style={{ background: course.iconBg, color: course.iconColor }}
              >
                <span>{course.icon}</span>
              </div>
              <div className="ce-also-info">
                <div className="ce-also-name">{course.title}</div>
                <div className="ce-also-meta">
                  <span className="ce-stars">{renderStars(course.rating)}</span>
                  <span>{course.rating} &bull; {course.hours} &bull; {course.students}</span>
                </div>
              </div>
              <div className="ce-also-right">
                <div className="ce-also-price">{course.price}</div>
                <div className="ce-also-old">{course.oldPrice}</div>
                <button
                  className={`ce-also-btn ${cartItems.includes(index) ? "ce-also-btn--added" : ""}`}
                  onClick={() => handleAddToCart(index)}
                >
                  {cartItems.includes(index) ? "Added ✓" : "Add to cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CourseEnrollment;