import { TUser } from '@/types'
import { AppRootState } from './index';
import { useSelector } from 'react-redux';
import deepEqual from 'fast-deep-equal';

enum ActionType {
  '/modal/setRequestId' = '/modal/setRequestId',
  '/modal/setLoading' = '/modal/setLoading'
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
};

type State = {
  requestId: string | null,
  loading: boolean
};

const initState: State = {
  requestId: null,
  loading: false
};

export const setRequestId = (requestId: string): Action<string> => ({
  type: ActionType['/modal/setRequestId'],
  payload: requestId
});

export const setLoading = (loading: boolean): Action<boolean> => ({
  type: ActionType['/modal/setLoading'],
  payload: loading,
});

export default function modal(state = initState, action: Action<any>): State {
  switch (action.type) {
    case ActionType['/modal/setRequestId']:
      return { ...state, requestId: action.payload };
    case ActionType['/modal/setLoading']:
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export const useModal: () => State = () => {
  return useSelector((state: AppRootState) => {
    return state.modal;
  }, deepEqual);
};
