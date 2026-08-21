import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { TeachingSessionScreen } from './TeachingSessionScreen';
import { TopicQuizScreen } from './TopicQuizScreen';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LearningPathWrapper: React.FC = () => {
  const { student } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeScreen, setActiveScreen] = useState<'session' | 'quiz'>('session');
  const [activeTopic, setActiveTopic] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);

  useEffect(() => {
    async function initializePath() {
      if (!student) return;
      try {
        setLoading(true);
        
        // Fetch the Learning Path
        const { data: lp, error: lpError } = await supabase
          .from('LearningPath')
          .select('*, topics:LearningPathTopic(*)')
          .eq('studentId', student.id)
          .order('createdAt', { ascending: false })
          .limit(1)
          .single();
          
        if (lpError) throw lpError;
        
        if (lp) {
          const sortedTopics = (lp.topics || []).sort((a: any, b: any) => a.priority - b.priority);

          // Find current topic
          const currentTopic = sortedTopics.find((t: any) => t.status === 'in_progress' || t.status === 'not_started') || sortedTopics[0];
          
          if (currentTopic) {
            setActiveTopic(currentTopic);
            
            // If topic is in progress, check if there is an active session
            const { data: existingSession } = await supabase
              .from('TopicSession')
              .select('*')
              .eq('learningPathTopicId', currentTopic.id)
              .order('createdAt', { ascending: false })
              .limit(1)
              .single();
              
            if (existingSession && existingSession.quizScore === null) {
               // A session is active
               setActiveScreen('session'); // Or quiz if we add state for that, but session is fine
            }
          } else {
             navigate('/student/dashboard');
          }
        }
      } catch (err: any) {
        console.error("Failed to load learning path:", err);
        setError("Failed to load your personalized learning path.");
      } finally {
        setLoading(false);
      }
    }
    initializePath();
  }, [student, navigate]);

  const handleSessionLoaded = (sessionData: any) => {
    setActiveSession(sessionData);
  };

    const handleProceedToQuiz = () => {
      setActiveScreen('quiz');
    };

    const handleQuizCompleted = async () => {
      // In a full implementation, this should transition to the next topic or return to dashboard
      navigate('/student/dashboard');
    };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <h3 style={{ marginTop: '1rem' }}>Designing Your Learning Path</h3>
        <p className="text-muted">Our AI tutor is analyzing your report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
        <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius)', color: 'var(--error)' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="learning-path-wrapper">
      <div style={{ padding: '1rem', marginBottom: '1rem' }}>
         <button className="btn" onClick={() => navigate('/student/dashboard')}>← Back to Dashboard</button>
      </div>
      
      {activeScreen === 'session' && activeTopic && (
        <TeachingSessionScreen 
          topic={activeTopic} 
          onProceed={handleProceedToQuiz}
          onSessionLoaded={handleSessionLoaded}
        />
      )}

      {activeScreen === 'quiz' && activeSession && (
        <TopicQuizScreen 
          session={activeSession}
          onComplete={handleQuizCompleted}
        />
      )}
    </div>
  );
};
