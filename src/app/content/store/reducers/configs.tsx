import { TModeConfigs, TTask } from '@/types';
import { AppRootState } from './index';
import { useSelector } from 'react-redux';

enum ActionType {
  '/configs/addModeConfigs' = '/configs/addModeConfigs',
  '/configs/addTasks' = '/configs/addTasks'
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
};

type State = {
  modeConfigs: TModeConfigs;
  tasks: TTask[];
};

const initState: State = {
  modeConfigs: {
    REGISTRY: '',
    CHAIN_ID: ''
  },
  tasks: [],
};

export const addModeConfigs = (
  modeConfigs: TModeConfigs,
): Action<TModeConfigs> => ({
  type: ActionType['/configs/addModeConfigs'],
  payload: modeConfigs,
});

export const addTasks = (
  tasks: TTask[],
): Action<TTask[]> => ({
  type: ActionType['/configs/addTasks'],
  payload: tasks,
});


export default function configs(
  state = initState,
  action: Action<any>,
): State {
  switch (action.type) {
    
    case ActionType['/configs/addModeConfigs']:
      return {
        ...state,
        modeConfigs: action.payload,
      };

    case ActionType['/configs/addTasks']:
      return {
        ...state,
        tasks: action.payload,
      };

    default:
      return state;
  }
}

export const useConfigs: () => State = () => {
  return useSelector((state: AppRootState) => {
    return state.configs;
  });
};
