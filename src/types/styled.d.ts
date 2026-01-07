import 'styled-components';
import { light } from '../themes';

declare module 'styled-components' {
  type MyTheme = typeof light;
  interface DefaultTheme extends MyTheme {

  }
}
