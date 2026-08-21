import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, PlayCircle, Trophy, BookOpen, Brain, Activity, Target } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [attemptMetrics, setAttemptMetrics] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!student) return;
      setLoading(true);
      try {
        // 1. Fetch the latest QuizAttempt for the AI Report and Metrics
        const { data: attempt } = await supabase
          .from('QuizAttempt')
          .select('*')
          .eq('studentId', student.id)
          .order('completedAt', { ascending: false })
          .limit(1)
          .single();
          
        if (attempt) {
          setAttemptMetrics({
            score: attempt.score,
            level: student.level,
            // Assuming we calculate learning index or just use score for now
            learningIndex: Math.round(attempt.score * 0.8 + 20), // Placeholder if not in DB
          });
          
          if (attempt.aiReport) {
            try {
              setReport(JSON.parse(attempt.aiReport));
            } catch (e) {
              setReport(attempt.aiReport);
            }
          }
        }

        // 2. Fetch the Learning Path
        const { data: lp } = await supabase
          .from('LearningPath')
          .select('*, topics:LearningPathTopic(*)')
          .eq('studentId', student.id)
          .order('createdAt', { ascending: false })
          .limit(1)
          .single();
          
        if (lp) {
          // Sort topics by priority
          const sortedTopics = (lp.topics || []).sort((a: any, b: any) => a.priority - b.priority);
          setTopics(sortedTopics);
        }

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboard();
  }, [student]);

  const handleContinueLearning = () => {
    // Navigate to the learning path wrapper. We pass state so it knows to resume.
    navigate('/student/learn');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '80vh', flexDirection: 'column' }}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <p style={{ marginTop: '1rem' }}>Loading your personalized dashboard...</p>
      </div>
    );
  }

  // Calculate Progress
  const masteredTopics = topics.filter(t => t.status === 'mastered').length;
  const totalTopics = topics.length;
  const overallProgress = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;
  
  // Find current topic
  const currentTopic = topics.find(t => t.status === 'in_progress' || t.status === 'not_started') || topics[0];

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Welcome back, {student?.name}</h1>
          <p className="text-muted" style={{ margin: 0 }}>Continue your personalized learning journey.</p>
        </div>
        <button className="btn" onClick={handleLogout}>Log Out</button>
      </div>

      {/* Hero Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel flex-center" style={{ flex: 1, padding: '1.5rem', flexDirection: 'column' }}>
          <Activity size={24} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Overall Score</h4>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{attemptMetrics?.score ? Math.round(attemptMetrics.score) : 0}%</span>
        </div>
        <div className="glass-panel flex-center" style={{ flex: 1, padding: '1.5rem', flexDirection: 'column' }}>
          <Brain size={24} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Learning Index</h4>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{attemptMetrics?.learningIndex || 0}</span>
        </div>
        <div className="glass-panel flex-center" style={{ flex: 1, padding: '1.5rem', flexDirection: 'column' }}>
          <Target size={24} color="var(--warning)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Category</h4>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
            {report?.learnerCategory || student?.level || 'Beginner'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Section 1: AI Performance Report */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Brain color="var(--primary)" />
            <h2 style={{ margin: 0 }}>AI Performance Report</h2>
          </div>
          
          {report ? (
            <div className="space-y">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--success)', margin: '0 0 0.5rem 0' }}>Strengths</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                    {report.strongTopics?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                    {(!report.strongTopics || report.strongTopics.length === 0) && <li>None yet</li>}
                  </ul>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--error)', margin: '0 0 0.5rem 0' }}>Weaknesses</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                    {report.weakTopics?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                    {(!report.weakTopics || report.weakTopics.length === 0) && <li>None yet</li>}
                  </ul>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Knowledge Gaps</h4>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                  {report.knowledgeGaps?.map((gap: string, i: number) => <li key={i}>{gap}</li>)}
                </ul>
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', borderLeft: '4px solid var(--primary)', background: 'var(--glass-highlight)', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Overall Assessment</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{report.overallAssessment}</p>
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', borderLeft: '4px solid var(--primary)', background: 'var(--glass-highlight)', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Difficulty Analysis</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{report.difficultyLevelAnalysis}</p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Improvement Priorities</h4>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', margin: 0 }}>
                  {report.improvementPriorities?.map((p: string, i: number) => <li key={i} style={{ marginBottom: '0.25rem' }}>{p}</li>)}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Personalized Learning Recommendations</h4>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', margin: 0 }}>
                  {report.personalizedLearningRecommendations?.map((r: string, i: number) => <li key={i} style={{ marginBottom: '0.25rem' }}>{r}</li>)}
                </ul>
              </div>

              {report.topicMasteryBreakdown && Object.keys(report.topicMasteryBreakdown).length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Topic Mastery Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {Object.entries(report.topicMasteryBreakdown).map(([topic, mastery], i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.9rem' }}>
                        <span>{topic}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{mastery}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.motivationSummary && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1rem', fontStyle: 'italic', color: 'var(--text-main)' }}>"{report.motivationSummary}"</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">No report generated yet.</p>
          )}
        </div>

        {/* Column 2: Path & Improvement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 3: Improvement */}
          <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(30,30,40,0.8) 0%, rgba(20,20,30,0.9) 100%)', border: '1px solid var(--primary-glow)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy color="var(--warning)" /> Your Improvement
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="text-muted">Topics Mastered</span>
              <span style={{ fontWeight: 'bold' }}>{masteredTopics} / {totalTopics}</span>
            </div>
            
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${overallProgress}%`, background: 'var(--success)', transition: 'width 0.5s ease' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)' }}>Current Topic</h4>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{currentTopic?.topicName || 'None'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)' }}>Status</h4>
                <span style={{ fontSize: '1.1rem', textTransform: 'capitalize', color: currentTopic?.status === 'mastered' ? 'var(--success)' : 'var(--primary)' }}>
                  {currentTopic?.status?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleContinueLearning} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <PlayCircle size={20} />
              Continue Learning
            </button>
          </div>

          {/* Section 2: Learning Path */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen color="var(--primary)" /> Learning Path
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topics.map((topic, index) => (
                <div key={topic.id} style={{ 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  background: topic.status === 'in_progress' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: topic.status === 'in_progress' ? '1px solid var(--primary)' : '1px solid transparent',
                  opacity: topic.status === 'not_started' && index !== 0 && topics[index-1]?.status !== 'mastered' ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{index + 1}. {topic.topicName}</h3>
                    {topic.status === 'mastered' && <Trophy size={16} color="var(--success)" />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status: <span style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{topic.status.replace('_', ' ')}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
