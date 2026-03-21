import { useContext } from 'react';
import { TrainingContext } from '../contexts/trainingContextState';

export const useTraining = () => {
  const ctx = useContext(TrainingContext);
  if (!ctx) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return ctx;
};
