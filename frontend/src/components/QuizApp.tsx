import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QuestionCard } from './QuestionCard';
import { ResultsScreen } from './ResultsScreen';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const QUIZ_TITLE = "Initial Ability Assessment";

export const QuizApp: React.FC = () => {
  const { student } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string, selectedOptionId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    async function loadQuiz() {
      // Fetch quiz by title
      const { data: quizData, error: quizError } = await supabase
        .from('Quiz')
        .select('id')
        .eq('title', QUIZ_TITLE)
        .single();
        
      if (quizError || !quizData) {
        console.error('Failed to load quiz', quizError);
        setLoading(false);
        return;
      }
      
      setQuizId(quizData.id);

      // Fetch questions
      const { data: qData, error: qError } = await supabase
        .from('QuizQuestion')
        .select('*')
        .eq('quizId', quizData.id)
        .order('orderIndex', { ascending: true });
        
      if (qError) {
        console.error('Failed to load questions', qError);
      } else {
        setQuestions(qData || []);
      }
      setLoading(false);
    }
    
    loadQuiz();
  }, []);

  const handleSelectOption = (optionId: string) => {
    const currentQId = questions[currentIndex].id;
    setAnswers(prev => {
      const existing = prev.filter(a => a.questionId !== currentQId);
      return [...existing, { questionId: currentQId, selectedOptionId: optionId }];
    });
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Submit assessment
      setSubmitting(true);
      try {
        const { data, error } = await supabase.functions.invoke('submit-quiz', {
          body: {
            quizId,
            studentId: student?.id,
            answers
          }
        });
        if (error) throw error;

        // Manually update student state since we cannot deploy updated Edge Functions
        if (student?.id) {
          await supabase.from('Student').update({ 
            level: data.newLevel, 
            assessmentCompleted: true 
          }).eq('id', student.id);
        }

        setResults(data);
      } catch (err) {
        console.error("Submission failed", err);
        alert("Failed to submit assessment. Check console for details.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleFastForward = async () => {
    setSubmitting(true);
    const mockAnswers = questions.map(q => {
      let parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      // Randomly pick an option to simulate real test
      const randomOpt = parsedOptions[Math.floor(Math.random() * parsedOptions.length)];
      return { questionId: q.id, selectedOptionId: randomOpt.id };
    });

    try {
      const { data, error } = await supabase.functions.invoke('submit-quiz', {
        body: {
          quizId,
          studentId: student?.id,
          answers: mockAnswers
        }
      });
      if (error) throw error;

      // Manually update student state since we cannot deploy updated Edge Functions
      if (student?.id) {
        await supabase.from('Student').update({ 
          level: data.newLevel, 
          assessmentCompleted: true 
        }).eq('id', student.id);
      }

      setResults(data);
    } catch (err) {
      console.error("Fast forward failed", err);
      alert("Failed to fast forward.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
        <Loader2 size={40} color="var(--primary)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem' }}>Loading your assessment...</p>
      </div>
    );
  }

  if (results) {
    return (
      <ResultsScreen 
        score={results.score} 
        newLevel={results.newLevel} 
        abilityCategory={results.abilityCategory}
        attemptId={results.attemptId} 
      />
    );
  }

  if (questions.length === 0) {
    return <div className="glass-card">No questions found. Make sure the database is seeded.</div>;
  }

  const currentQuestion = questions[currentIndex];
  // Parse options string back to object array
  let parsedOptions = [];
  try {
    parsedOptions = typeof currentQuestion.options === 'string' 
      ? JSON.parse(currentQuestion.options) 
      : currentQuestion.options;
  } catch(e) {}
  
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)?.selectedOptionId || null;

  return (
    <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <button onClick={handleFastForward} style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Fast Forward ⏭️</button>
        <span>{Math.round(((currentIndex) / questions.length) * 100)}% Complete</span>
      </div>
      
      {submitting ? (
        <div className="glass-card flex-center" style={{ padding: '3rem', flexDirection: 'column' }}>
          <Loader2 size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <h3>Analyzing Responses</h3>
          <p style={{ margin: 0 }}>Our AI is calculating your baseline ability...</p>
        </div>
      ) : (
        <QuestionCard 
          questionText={currentQuestion.questionText}
          options={parsedOptions}
          selectedOptionId={currentAnswer}
          onSelectOption={handleSelectOption}
          onNext={handleNext}
          isLast={currentIndex === questions.length - 1}
        />
      )}
    </div>
  );
};
