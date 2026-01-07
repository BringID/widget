import { combineReducers } from 'redux';
import user from './user';
import verifications from './verifications';
import modal from './modal';

const rootReducer = combineReducers({
  user,
  verifications,
  modal
});

export type AppRootState = ReturnType<typeof rootReducer>;
export default rootReducer;
