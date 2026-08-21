import React from 'react';

type Option = {
  id: string;
  text: string;
};

type QuestionCardProps = {
  questionText: string;
  options: Option[];
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
  isLast: boolean;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionText,
  options,
  selectedOptionId,
  onSelectOption,
  onNext,
  isLast,
}) => {
  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h2 style={{ marginBottom: '2rem' }}>{questionText}</h2>
      
      <div className="space-y">
        {options.map((opt) => (
          <button
            key={opt.id}
            className={`option-btn ${selectedOptionId === opt.id ? 'selected' : ''}`}
            onClick={() => onSelectOption(opt.id)}
          >
            {opt.text}
            {selectedOptionId === opt.id && (
              <span style={{ color: 'var(--primary)' }}>●</span>
            )}
          </button>
        ))}
      </div>
      
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-primary" 
          onClick={onNext}
          disabled={!selectedOptionId}
          style={{ opacity: selectedOptionId ? 1 : 0.5, cursor: selectedOptionId ? 'pointer' : 'not-allowed' }}
        >
          {isLast ? 'Submit Assessment' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};
