import { combineReducers } from 'redux';
import user from './user';
import verifications from './verifications';
import modal from './modal';
import configs from './configs';

const rootReducer = combineReducers({
  user,
  verifications,
  modal,
  configs
});

export type AppRootState = ReturnType<typeof rootReducer>;
export default rootReducer;
