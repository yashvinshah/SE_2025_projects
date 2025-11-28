import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './Quests.css';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  reward: number | object;
  difficulty?: 'easy' | 'medium' | 'hard';
  progress: number;
  isCompleted: boolean;
  completedAt?: Date | any;
  hasStarted?: boolean;
}

const Quests: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quests, isLoading } = useQuery({
    queryKey: ['userQuests', user?.id],
    queryFn: async () => {
      const response = await api.get(`/quests/user/${user?.id}`);
      return response.data.quests;
    },
    enabled: !!user
  });

  const startQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      console.log('Starting quest with user:', user);
      console.log('User ID:', user?.id);
      const response = await api.post('/quests/start', {
        userId: user?.id,
        questId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userQuests'] });
    },
    onError: (error: any) => {
      console.error('Start quest error:', error.response?.data);
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#666';
    }
  };

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'order_count': return '📦';
      case 'spending_amount': return '💰';
      case 'cuisine_type': return '🍽️';
      case 'restaurant_visit': return '🏪';
      default: return '🎯';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🎯</div>
        <p>Loading your quests...</p>
      </div>
    );
  }

  const activeQuests = quests?.filter((quest: Quest) => !quest.isCompleted) || [];
  const completedQuests = quests?.filter((quest: Quest) => quest.isCompleted) || [];

  return (
    <div className="quests">
      <div className="quests-header">
        <h1>Food Challenges 🎯</h1>
        <p>Complete challenges to earn bonus points and unlock achievements!</p>
      </div>

      {/* Active Quests */}
      {activeQuests.length > 0 && (
        <div className="quests-section">
          <h2>Active Challenges ({activeQuests.length})</h2>
          <div className="quests-grid">
            {activeQuests.map((quest: Quest) => (
              <div key={quest.id} className="quest-card active">
                <div className="quest-header">
                  <div className="quest-icon">{getQuestIcon(quest.type)}</div>
                  {quest.difficulty && (
                    <div className="quest-difficulty" style={{ backgroundColor: getDifficultyColor(quest.difficulty) }}>
                      {quest.difficulty.toUpperCase()}
                    </div>
                  )}
                </div>
                
                <h3>{quest.title}</h3>
                <p className="quest-description">{quest.description}</p>
                
                <div className="quest-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${quest.progress * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {Math.round(quest.progress * 100)}% Complete
                  </span>
                </div>
                
                <div className="quest-reward">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-text">
                    {typeof quest.reward === 'number' ? `${quest.reward} Points` : 'Badge Reward'}
                  </span>
                </div>
                
                {quest.progress === 0 && !quest.hasStarted && (
                  <button 
                    className="btn btn-primary start-quest-btn"
                    onClick={() => startQuestMutation.mutate(quest.id)}
                    disabled={startQuestMutation.isPending}
                  >
                    {startQuestMutation.isPending ? 'Starting...' : 'Start Challenge'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <div className="quests-section">
          <h2>Completed Challenges ({completedQuests.length})</h2>
          <div className="quests-grid">
            {completedQuests.map((quest: Quest) => (
              <div key={quest.id} className="quest-card completed">
                <div className="quest-header">
                  <div className="quest-icon">{getQuestIcon(quest.type)}</div>
                  <div className="completion-badge">✅ COMPLETED</div>
                </div>
                
                <h3>{quest.title}</h3>
                <p className="quest-description">{quest.description}</p>
                
                <div className="quest-progress">
                  <div className="progress-bar">
                    <div className="progress-fill completed" style={{ width: '100%' }}></div>
                  </div>
                  <span className="progress-text">100% Complete</span>
                </div>
                
                <div className="quest-reward earned">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-text">
                    {typeof quest.reward === 'number' ? `${quest.reward} Points Earned` : 'Badge Earned'}
                  </span>
                </div>
                
                {quest.completedAt && (
                  <div className="completion-date">
                    Completed: {(quest.completedAt as any)?._seconds ? 
                      new Date((quest.completedAt as any)._seconds * 1000).toLocaleDateString() : 
                      new Date(quest.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {quests && quests.length === 0 && (
        <div className="no-quests">
          <div className="no-quests-icon">🎯</div>
          <h2>No challenges available</h2>
          <p>Check back later for new food challenges!</p>
        </div>
      )}
    </div>
  );
};

export default Quests;