import { AppRootState } from './index';
import { useSelector } from 'react-redux';
import deepEqual from 'fast-deep-equal';

enum ActionType {
  '/modal/setLoading' = '/modal/setLoading',
  '/modal/setMinPoints' = '/modal/setMinPoints'
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
};

type State = {
  loading: boolean
  minPoints: number
};

const initState: State = {
  loading: false,
  minPoints: 0
};

export const setMinPoints = (minPoints: number): Action<number> => ({
  type: ActionType['/modal/setMinPoints'],
  payload: minPoints
});

export const setLoading = (loading: boolean): Action<boolean> => ({
  type: ActionType['/modal/setLoading'],
  payload: loading,
});

export default function modal(state = initState, action: Action<any>): State {
  switch (action.type) {
    case ActionType['/modal/setLoading']:
      return { ...state, loading: action.payload };
    case ActionType['/modal/setMinPoints']:
      return { ...state, minPoints: action.payload };
    default:
      return state;
  }
}

export const useModal: () => State = () => {
  return useSelector((state: AppRootState) => {
    return state.modal;
  }, deepEqual);
};
