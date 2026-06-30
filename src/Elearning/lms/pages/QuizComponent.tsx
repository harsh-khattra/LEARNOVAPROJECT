import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SupabaseClient} from '../../../Helper/Supabase'; 
import './QuizView.css';

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  quiz_options: Option[];
}

export const QuizComponent: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>(); // URL se dynamic content_id pakadne ke liye
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, Option>>({});
  const [loading, setLoading] = useState(true);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
   const loadQuizQuestions = async () => {
    try {
      setLoading(true);
      
useEffect(() => {
  if (contentId) {
    loadQuizQuestions();
  } else {
    // Agar URL mein ID nahi hai, toh loading band karo aur fasa mat rehne do
    setLoading(false); 
  }
}, [contentId]);


      //  Fetching questions based on your custom content_id
      const { data, error } = await SupabaseClient
        .from('quiz_questions')
        .select(`
          id,
          question_text,
          quiz_options (
            id,
            option_text,
            is_correct
          )
        `)
        .eq('content_id', contentId);

      if (error) throw error;
      setQuestions(data as unknown as Question[]);
    } catch (err) {
      console.error("Error fetching quiz content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: Option) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert("⚠️ Plz answer all questions before submitting!");
      return;
    }

    let calculatedScore = 0;
    Object.values(selectedAnswers).forEach(option => {
      if (option.is_correct) calculatedScore += 1;
    });

    try {
      const { data: { user } } = await SupabaseClient.auth.getUser();

      // 🟢 Inserting entry to match your quiz_submissions structure exactly
      const { error } = await SupabaseClient
        .from('quiz_submissions')
        .insert({
          user_id: user?.id || null, 
          content_id: contentId, // Maps to your specific content row
          score: calculatedScore,
          total_questions: questions.length
        });

      if (error) throw error;

      setFinalScore(calculatedScore);
      setQuizSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error("Submission failed:", error);
      alert("Could not log your test submission.");
    }
  };

  if (loading) return <div className="quiz-loader">Fetching assessment data... ⚡</div>;
  if (!contentId) {
  return (
    <div className="quiz-page-container" style={{ textAlign: 'center', padding: '40px' }}>
      <div className="quiz-header-card">
        <h2>⚠️ Assignment ID Missing</h2>
        <p>Please select a specific course content or topic from the layout to view its respective quiz.</p>
      </div>
    </div>
  );
}
  if (questions.length === 0) return <div className="quiz-loader">No questions mapped to this content yet.</div>;

  return (
    <div className="quiz-page-container">
      <div className="quiz-header-card">
        <h2>Content Evaluation Tracker</h2>
        <p>Complete this quick evaluation check to unlock your completion metric badge for this topic.</p>
        
        {quizSubmitted && (
          <div className="quiz-score-banner">
            <h3>🎯 Results Calculated!</h3>
            <p>Score Secured: <strong>{finalScore} / {questions.length}</strong> ({Math.round((finalScore / questions.length) * 100)}%)</p>
          </div>
        )}
      </div>

      <div className="questions-stack">
        {questions.map((q, idx) => (
          <div key={q.id} className="question-card">
            <span className="question-number">Assertion 0{idx + 1}</span>
            <h4 className="question-text">{q.question_text}</h4>
            
            <div className="options-grid">
              {q.quiz_options?.map((opt) => {
                const isSelected = selectedAnswers[q.id]?.id === opt.id;
                let optionClass = "option-item";
                if (isSelected) optionClass += " selected";
                if (quizSubmitted && opt.is_correct) optionClass += " correct-answer";
                if (quizSubmitted && isSelected && !opt.is_correct) optionClass += " wrong-answer";

                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={optionClass}
                    onClick={() => handleSelectOption(q.id, opt)}
                    disabled={quizSubmitted}
                  >
                    <span className="option-indicator"></span>
                    <span className="option-text-label">{opt.option_text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="quiz-footer-actions">
        {!quizSubmitted ? (
          <button type="button" className="quiz-submit-trigger" onClick={handleSubmitQuiz}>
            Compile & Lock Submissions
          </button>
        ) : (
          <button type="button" className="quiz-back-trigger" onClick={() => navigate(-1)}>
            Back to Course Content
          </button>
        )}
      </div>
    </div>
  );
};