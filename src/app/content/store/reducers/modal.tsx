import { TUser } from '@/types'
import { AppRootState } from './index';
import { useSelector } from 'react-redux';
import deepEqual from 'fast-deep-equal';

enum ActionType {
  '/modal/setIsOpen' = '/modal/setIsOpen',
  '/modal/setLoading' = '/modal/setLoading'
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
};

type State = {
  isOpen: boolean,
  loading: boolean
};

const initState: State = {
  isOpen: false,
  loading: false
};

export const setIsOpen = (isOpen: boolean): Action<boolean> => ({
  type: ActionType['/modal/setIsOpen'],
  payload: isOpen,
});

export const setLoading = (loading: boolean): Action<boolean> => ({
  type: ActionType['/modal/setLoading'],
  payload: loading,
});

export default function modal(state = initState, action: Action<any>): State {
  switch (action.type) {
    case ActionType['/modal/setIsOpen']:
      return { ...state, isOpen: action.payload };
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
