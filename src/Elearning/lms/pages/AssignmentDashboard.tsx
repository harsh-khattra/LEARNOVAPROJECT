import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseClient } from '../../../Helper/Supabase';
import './AssignmentDashboard.css';

interface AssignmentItem {
  content_id: string;
  title: string;
  total_questions: number;
  status: 'Pending' | 'Completed';
  score_secured?: number;
}

export const AssignmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchAssignmentsData();
  }, []);

  const fetchAssignmentsData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Logged in User
      const { data: { user } } = await SupabaseClient.auth.getUser();
      
      // 2. Fetch all questions grouped by content to find out available assignments
      const { data: questionsData, error: qError } = await SupabaseClient
        .from('quiz_questions')
        .select('content_id, id');
        
      if (qError) throw qError;

      // 3. Fetch current user's submissions to check what is completed
      const { data: submissionsData, error: sError } = await SupabaseClient
        .from('quiz_submissions')
        .select('content_id, score, total_questions')
        .eq('user_id', user?.id || '');

      if (sError) throw sError;

      // 4. Grouping & Mapping Logic (Simulating complex joins locally for simplicity)
      // For real testing, we map unique content_ids as assignment tasks
      const uniqueContentIds = Array.from(new Set(questionsData.map(q => q.content_id)));
      
      const mappedList: AssignmentItem[] = uniqueContentIds.map((cId, index) => {
        const totalQ = questionsData.filter(q => q.content_id === cId).length;
        const pastSubmission = submissionsData?.find(s => s.content_id === cId);
        
        return {
          content_id: cId || `dummy-id-${index}`,
          title: `Module Assignment Mastery Task ${index + 1}`, // Can be linked to contents table title later
          total_questions: totalQ,
          status: pastSubmission ? 'Completed' : 'Pending',
          score_secured: pastSubmission ? pastSubmission.score : undefined
        };
      });

      setAssignments(mappedList);
    } catch (err) {
      console.error("Error compilation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Tab Filtering Logic
  const filteredAssignments = assignments.filter(item => {
    if (activeTab === 'pending') return item.status === 'Pending';
    if (activeTab === 'completed') return item.status === 'Completed';
    return true;
  });

  // Calculate quick metrics for the top bar
  const totalCount = assignments.length;
  const completedCount = assignments.filter(a => a.status === 'Completed').length;
  const pendingCount = totalCount - completedCount;

  if (loading) return <div className="asm-loader">Compiling your academic board... 📊</div>;

  return (
    <div className="asm-dashboard-layout">
      
      {/* Top Banner Overview */}
      <div className="asm-header-section">
        <h2>Your Assignments & Worksheets</h2>
        <p>Track your evaluation progress, review performance scoring, and complete pending checks.</p>
      </div>

      {/* Analytics Counter Metric Cards */}
      <div className="asm-counters-grid">
        <div className="asm-card-stat">
          <h3>{totalCount}</h3>
          <p>Total Tasks Assigned</p>
        </div>
        <div className="asm-card-stat pending">
          <h3>{pendingCount}</h3>
          <p>Pending Review</p>
        </div>
        <div className="asm-card-stat completed">
          <h3>{completedCount}</h3>
          <p>Assessments Completed</p>
        </div>
      </div>

      {/* Filter Tabs Controller */}
      <div className="asm-filter-bar">
        <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All Tasks</button>
        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>Pending ({pendingCount})</button>
        <button className={activeTab === 'completed' ? 'active' : ''} onClick={() => setActiveTab('completed')}>Completed ({completedCount})</button>
      </div>

      {/* Task Rows Render Pipeline */}
      <div className="asm-list-stack">
        {filteredAssignments.length === 0 ? (
          <div className="asm-empty-state">No assignments match the selected filter category.</div>
        ) : (
          filteredAssignments.map((asm) => (
            <div key={asm.content_id} className="asm-task-row-card">
              <div className="asm-meta-details">
                <span className={`asm-badge ${asm.status.toLowerCase()}`}>{asm.status}</span>
                <h4>{asm.title}</h4>
                <p>Task Parameter: Contains {asm.total_questions} Objective Assertions</p>
              </div>
              
              <div className="asm-action-zone">
                {asm.status === 'Pending' ? (
                  // Redirects user cleanly to the dynamic quiz view page path
                  <button 
                    className="asm-action-btn start" 
                    onClick={() => navigate(`/learning/student/assignments/${asm.content_id}`)}
                  >
                    Start Test 📝
                  </button>
                ) : (
                  <div className="asm-score-display">
                    Score: <strong>{asm.score_secured}/{asm.total_questions}</strong> Verified
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};