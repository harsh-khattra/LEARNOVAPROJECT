import "./CourseSkeleton.css";

const CourseSkeleton = () => {
  return (
    <div className="course-skeleton-card">
      <div className="course-skeleton-image"></div>

      <div className="course-skeleton-content">
        <div className="course-skeleton-title"></div>

        <div className="course-skeleton-text"></div>

        <div className="course-skeleton-text short"></div>

        <div className="course-skeleton-footer">
          <div className="course-skeleton-tag"></div>
          <div className="course-skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};

export default CourseSkeleton;