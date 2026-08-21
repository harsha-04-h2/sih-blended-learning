import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowRight, BookOpen } from 'lucide-react';

type TeachingSessionScreenProps = {
  topic: any;
  onProceed: () => void;
  onSessionLoaded: (sessionData: any) => void;
};

export const TeachingSessionScreen: React.FC<TeachingSessionScreenProps> = ({ topic, onProceed, onSessionLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<any>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        // Check if there's already an active session for this topic that is not completed
        const { data: existingSession } = await supabase
          .from('TopicSession')
          .select('*')
          .eq('learningPathTopicId', topic.id)
          .order('createdAt', { ascending: false })
          .limit(1)
          .single();

        if (existingSession && existingSession.quizScore === null) {
          // Found an active session, use it
          const parsedLesson = JSON.parse(existingSession.lessonContent);
          const parsedQuiz = JSON.parse(existingSession.quizQuestions);
          
          setLesson(parsedLesson);
          onSessionLoaded({
            id: existingSession.id,
            lesson: parsedLesson,
            quiz: parsedQuiz
          });
        } else {
          // Generate a new session
          const { data, error: generateError } = await supabase.functions.invoke('generate-teaching-session', {
            body: { learningPathTopicId: topic.id }
          });

          if (generateError) throw generateError;
          if (data.error) throw new Error(data.error);

          setLesson(data.sessionData.lesson);
          onSessionLoaded({ id: data.sessionId, ...data.sessionData });
        }
      } catch (err: any) {
        console.error("Failed to load session:", err);
        setError("Failed to load the teaching session. The AI service might be overloaded right now. Please try again in a few moments.");
      } finally {
        setLoading(false);
      }
    }
    
    loadSession();
  }, [topic.id]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
        <Loader2 size={40} color="var(--primary)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <h3 style={{ marginTop: '1rem' }}>AI Tutor is preparing your lesson...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Topic: {topic.topicName}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card flex-center" style={{ padding: '2rem', color: 'var(--error)' }}>
        {error}
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
          <BookOpen size={24} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Topic: {topic.topicName}</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Estimated Time: 10 minutes</p>
        </div>
      </div>

      <div className="space-y">
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', marginTop: 0 }}>Introduction</h3>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{lesson.introduction}</p>
        </section>

        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', marginTop: 0 }}>Core Concepts</h3>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{lesson.coreConcepts}</p>
        </section>

        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', marginTop: 0 }}>Examples</h3>
          {lesson.examples?.map((ex: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--primary-glow)', display: 'block', marginBottom: '0.5rem' }}>{ex.level} Example</strong>
              <p style={{ margin: 0, color: 'var(--text-main)' }}>{ex.content}</p>
            </div>
          ))}
        </section>

        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', marginTop: 0 }}>Practical Understanding</h3>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{lesson.practicalUnderstanding}</p>
        </section>

        <section className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ color: 'var(--success)', marginTop: 0 }}>Summary</h3>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>{lesson.summary}</p>
        </section>
      </div>

      <div className="flex-center" style={{ marginTop: '3rem' }}>
        <button className="btn btn-primary" onClick={onProceed} style={{ width: '100%', maxWidth: '400px', fontSize: '1.1rem', padding: '1rem' }}>
          Take Knowledge Check Quiz <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
