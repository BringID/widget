import { TUser } from '@/types'
import { AppRootState } from './index';
import { useSelector } from 'react-redux';
import deepEqual from 'fast-deep-equal';

enum ActionType {
  '/user/setKey' = '/user/setKey',
  '/user/setId' = '/user/setId',
  '/user/setUser' = '/user/setUser',
  '/user/setLoading' = '/user/setLoading',
  '/user/setAddress' = '/user/setAddress',
  '/user/setApiKey' = '/user/setApiKey',
  '/user/destroy' = '/user/destroy',
  '/user/setScope' = '/user/setScope'
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
};

type State = TUser;

const initState: State = {
  key: null,
  id: null,
  address: null,
  loading: false,
  apiKey: null,
  scope: null
};

export const setKey = (key: string | null): Action<string | null> => ({
  type: ActionType['/user/setKey'],
  payload: key,
})

export const destroy = () => ({
  type: ActionType['/user/destroy']
})

export const setLoading = (loading: boolean): Action<boolean> => ({
  type: ActionType['/user/setLoading'],
  payload: loading,
})

export const setScope = (scope: string | null): Action<string | null> => ({
  type: ActionType['/user/setScope'],
  payload: scope,
})

export const setId = (id: string): Action<string> => ({
  type: ActionType['/user/setId'],
  payload: id,
})

export const setUser = (user: TUser): Action<TUser> => ({
  type: ActionType['/user/setUser'],
  payload: user,
})

export const setAddress = (address: string | null): Action<string | null> => ({
  type: ActionType['/user/setAddress'],
  payload: address,
})

export const setApiKey = (apiKey: string): Action<string> => ({
  type: ActionType['/user/setApiKey'],
  payload: apiKey,
})

export default function user(state = initState, action: Action<any>): State {
  switch (action.type) {
    case ActionType['/user/setKey']:
      return { ...state, key: action.payload };

    case ActionType['/user/setUser']:
      return action.payload;

    case ActionType['/user/setScope']:
      return  { ...state, scope: action.payload };

    case ActionType['/user/destroy']:
      return initState

    case ActionType['/user/setId']:
      return { ...state, id: action.payload };

    case ActionType['/user/setLoading']:
      return { ...state, loading: action.payload };

    case ActionType['/user/setApiKey']:
      return { ...state, apiKey: action.payload };

    case ActionType['/user/setAddress']:
      return { ...state, address: action.payload };

    default:
      return state;
  }
}

export const useUser: () => State = () => {
  return useSelector((state: AppRootState) => {
    return state.user;
  }, deepEqual);
};
