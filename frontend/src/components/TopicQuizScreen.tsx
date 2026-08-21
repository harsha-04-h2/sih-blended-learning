import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { QuestionCard } from './QuestionCard';
import { Loader2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

type TopicQuizScreenProps = {
  session: any;
  onComplete: () => void;
};

export const TopicQuizScreen: React.FC<TopicQuizScreenProps> = ({ session, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionIndex: number, selectedOptionId: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const quiz = session.quiz;

  const handleSelectOption = (optionId: string) => {
    setAnswers(prev => {
      const existing = prev.filter(a => a.questionIndex !== currentIndex);
      return [...existing, { questionIndex: currentIndex, selectedOptionId: optionId }];
    });
  };

  const handleNext = async () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Submit assessment
      setSubmitting(true);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('evaluate-topic-quiz', {
          body: {
            sessionId: session.id,
            studentAnswers: answers
          }
        });
        
        if (invokeError) throw invokeError;
        if (data.error) throw new Error(data.error);

        setResults(data);
      } catch (err: any) {
        console.error("Submission failed", err);
        setError("Failed to evaluate quiz. The AI service might be overloaded right now. Please try again in a few moments.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (error) {
    return (
      <div className="glass-card flex-center" style={{ padding: '2rem', color: 'var(--error)' }}>
        {error}
      </div>
    );
  }

  if (results) {
    const isMastered = results.masteryLevel === 'Mastered';
    const isPartial = results.masteryLevel === 'Partially Mastered';
    const color = isMastered ? 'var(--success)' : isPartial ? '#f59e0b' : 'var(--error)';
    const Icon = isMastered ? CheckCircle : AlertCircle;

    return (
      <div className="glass-card flex-center animate-fade-in" style={{ flexDirection: 'column', textAlign: 'center', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ 
          width: '80px', height: '80px', 
          borderRadius: '50%', 
          background: `rgba(${isMastered ? '16, 185, 129' : isPartial ? '245, 158, 11' : '239, 68, 68'}, 0.1)`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <Icon size={40} color={color} />
        </div>

        <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>{results.masteryLevel}</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          You scored {results.score}% ({results.correctCount} / {results.total} correct)
        </p>

        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', width: '100%' }}>
          <h4 style={{ color: color, margin: '0 0 0.5rem 0' }}>AI Action Plan</h4>
          <p style={{ margin: 0, color: 'var(--text-main)' }}>{results.action}</p>
        </div>

        <button className="btn btn-primary" onClick={onComplete} style={{ width: '100%', maxWidth: '300px' }}>
          Continue Learning Path <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  const currentQuestion = quiz[currentIndex];
  const currentAnswer = answers.find(a => a.questionIndex === currentIndex)?.selectedOptionId || null;

  return (
    <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <span>Knowledge Check {currentIndex + 1} of {quiz.length}</span>
        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Difficulty: {currentQuestion.difficulty}</span>
      </div>
      
      {submitting ? (
        <div className="glass-card flex-center" style={{ padding: '3rem', flexDirection: 'column' }}>
          <Loader2 size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <h3>Evaluating Answers</h3>
          <p style={{ margin: 0 }}>Checking mastery rules...</p>
        </div>
      ) : (
        <QuestionCard 
          questionText={currentQuestion.question}
          options={currentQuestion.options}
          selectedOptionId={currentAnswer}
          onSelectOption={handleSelectOption}
          onNext={handleNext}
          isLast={currentIndex === quiz.length - 1}
        />
      )}
    </div>
  );
};
