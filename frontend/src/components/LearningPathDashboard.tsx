import React from 'react';
import { BookOpen, CheckCircle, Circle, Play, AlertCircle } from 'lucide-react';

type LearningPathDashboardProps = {
  topics: any[];
  onStartTopic: (topicId: string) => void;
};

export const LearningPathDashboard: React.FC<LearningPathDashboardProps> = ({ topics, onStartTopic }) => {
  return (
    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <BookOpen size={32} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Your Personalized Learning Path</h2>
      </div>

      <div className="space-y">
        {topics.map((topic, index) => {
          let StatusIcon = Circle;
          let statusColor = 'var(--text-muted)';
          let statusText = 'Not Started';

          if (topic.status === 'mastered') {
            StatusIcon = CheckCircle;
            statusColor = 'var(--success)';
            statusText = 'Mastered';
          } else if (topic.status === 'partially_mastered') {
            StatusIcon = AlertCircle;
            statusColor = '#f59e0b';
            statusText = 'Needs Revision';
          } else if (topic.status === 'not_mastered') {
            StatusIcon = AlertCircle;
            statusColor = 'var(--error)';
            statusText = 'Needs Remediation';
          } else if (topic.status === 'in_progress') {
            StatusIcon = Play;
            statusColor = 'var(--primary)';
            statusText = 'In Progress';
          }

          // In a sequential path, the next active topic is the first one that is NOT mastered
          const isNextActive = index === topics.findIndex(t => t.status !== 'mastered');
          const isLocked = index > topics.findIndex(t => t.status !== 'mastered') && topics.findIndex(t => t.status !== 'mastered') !== -1;

          return (
            <div 
              key={topic.id} 
              className={`glass-panel`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderLeft: isNextActive ? '4px solid var(--primary)' : '4px solid transparent',
                opacity: isLocked ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <StatusIcon size={24} color={statusColor} />
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{topic.topicName}</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {topic.reason || `Priority Level ${topic.priority}`}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: statusColor, fontWeight: 'bold' }}>
                    {statusText}
                  </p>
                </div>
              </div>
              
              {!isLocked && topic.status !== 'mastered' && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => onStartTopic(topic.id)}
                >
                  {topic.status === 'not_started' ? 'Start Lesson' : 'Resume Topic'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
