import React, { useEffect, useState } from 'react';
import { Trophy, ArrowRight, Target, Activity, Brain, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

type ResultsScreenProps = {
  score: number;
  newLevel: string;
  abilityCategory: string;
  attemptId: string;
};

type AIReport = {
  overallAssessment: string;
  learnerCategory: string;
  strongTopics: string[];
  weakTopics: string[];
  topicMasteryBreakdown: Record<string, string | number>;
  difficultyLevelAnalysis: string;
  knowledgeGaps: string[];
  improvementPriorities: string[];
  personalizedLearningRecommendations: string[];
  motivationSummary: string;
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, newLevel, abilityCategory, attemptId }) => {
  const { refreshStudentState, student } = useAuth();
  const navigate = useNavigate();
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('analyze-quiz', {
          body: { attemptId }
        });
        
        if (invokeError) throw invokeError;
        if (data.error) throw new Error(data.error);

        if (student?.id) {
          await supabase.from('Student').update({ reportGenerated: true }).eq('id', student.id);
        }

        setAiReport(data.aiReport || data);
        if (data.isMock) {
          setIsMock(true);
        }
      } catch (err: any) {
        console.error("AI Analysis Failed:", err);
        setError("Failed to load AI Analysis. Please try again later.");
      } finally {
        setAnalyzing(false);
      }
    }
    
    if (attemptId) {
      fetchAnalysis();
    }
  }, [attemptId]);

  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.2s', width: '100%', maxWidth: '800px' }}>
      <div className="flex-center" style={{ flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ 
          width: '80px', height: '80px', 
          borderRadius: '50%', 
          background: 'rgba(99, 102, 241, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <Trophy size={40} color="var(--primary)" />
        </div>
        
        <h1 style={{ marginBottom: '0.5rem' }}>Assessment Complete!</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Here are your initial baseline results.</p>
        
        <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '2rem' }}>
          <div className="glass-panel flex-center" style={{ flex: 1, padding: '1.5rem', flexDirection: 'column' }}>
            <Activity size={24} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0 }}>Score</h3>
            <p style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0.5rem 0 0', fontWeight: 'bold' }}>
              {score}%
            </p>
          </div>
          
          <div className="glass-panel flex-center" style={{ flex: 1, padding: '1.5rem', flexDirection: 'column' }}>
            <Target size={24} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0 }}>Level</h3>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: '0.5rem 0 0', textTransform: 'capitalize', fontWeight: 'bold' }}>
              {newLevel}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--success)' }}>
              {abilityCategory}
            </p>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem', border: '1px solid var(--primary-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Brain color="var(--primary)" />
          <h2 style={{ margin: 0 }}>AI Learning Report</h2>
        </div>

        {analyzing ? (
          <div className="flex-center" style={{ padding: '2rem', flexDirection: 'column', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p>Gemini AI is analyzing your performance...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        ) : aiReport ? (
          <div className="space-y animate-fade-in" style={{ textAlign: 'left' }}>
            {isMock && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(234, 179, 8, 0.2)', color: '#fbbf24', borderRadius: '4px', border: '1px solid #fbbf24', textAlign: 'center', fontWeight: 'bold' }}>
                ⚠️ This is a hardcoded mock response because the AI service is currently unavailable.
              </div>
            )}
            <p style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}><strong>Overall Assessment:</strong> {aiReport.overallAssessment}</p>
            <p style={{ fontSize: '1.1rem', color: 'var(--primary)' }}><strong>Learner Category:</strong> {aiReport.learnerCategory}</p>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ color: 'var(--success)' }}>Strong Topics</h4>
                <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-main)' }}>
                  {aiReport.strongTopics?.map((topic, i) => <li key={i}>{topic}</li>)}
                </ul>
              </div>
              <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ color: 'var(--error)' }}>Weak Topics</h4>
                <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-main)' }}>
                  {aiReport.weakTopics?.map((topic, i) => <li key={i}>{topic}</li>)}
                </ul>
              </div>
            </div>

            {aiReport.topicMasteryBreakdown && (
              <div style={{ marginTop: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Topic Mastery Breakdown</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {Object.entries(aiReport.topicMasteryBreakdown).map(([topic, mastery]) => (
                    <div key={topic} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{topic}</span>
                      <strong style={{ color: 'var(--primary-glow)' }}>{mastery}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)' }}>Difficulty Level Analysis</h4>
              <p style={{ color: 'var(--text-main)', lineHeight: '1.5' }}>{aiReport.difficultyLevelAnalysis}</p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)' }}>Knowledge Gaps</h4>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-main)' }}>
                {aiReport.knowledgeGaps?.map((gap, i) => <li key={i}>{gap}</li>)}
              </ul>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)' }}>Improvement Priorities</h4>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-main)' }}>
                {aiReport.improvementPriorities?.map((gap, i) => <li key={i}>{gap}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)' }}>Recommendations</h4>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-main)' }}>
                {aiReport.personalizedLearningRecommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', borderLeft: '4px solid var(--primary)', background: 'var(--glass-highlight)' }}>
              <p style={{ margin: 0, fontStyle: 'italic' }}>"{aiReport.motivationSummary}"</p>
            </div>
          </div>
        ) : null}
      </div>
      
      <div className="flex-center" style={{ marginTop: '2rem', gap: '1rem' }}>
        {aiReport && (
          <button 
            className="btn btn-primary" 
            disabled={generatingPath}
            onClick={async () => {
              setGeneratingPath(true);
              try {
                const { error: invokeError } = await supabase.functions.invoke('generate-learning-path', {
                  body: { attemptId }
                });
                if (invokeError) throw invokeError;
                
                if (student?.id) {
                  await supabase.from('Student').update({ learningPathGenerated: true }).eq('id', student.id);
                }

                // Refresh state so protected routes know assessment is fully complete and path is generated
                await refreshStudentState();
                navigate('/student/dashboard');
              } catch (err) {
                console.error("Failed to generate path:", err);
                setError("Failed to generate learning path. Please try again.");
                setGeneratingPath(false);
              }
            }} 
            style={{ width: '100%', maxWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {generatingPath ? (
              <><Loader2 size={18} className="animate-spin" /> Generating Path...</>
            ) : (
              <>Generate Personalized Learning Path <ArrowRight size={18} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
