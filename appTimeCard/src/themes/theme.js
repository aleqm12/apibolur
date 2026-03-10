import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7A1E3A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#63859E',
      contrastText: '#FFFFFF',
    },
    primaryLight: {
      main: '#63859E',
      contrastText: '#FFFFFF',
    },
  },
  components: {
    MuiInputBase: {
      defaultProps: {
        inputProps: {
          spellCheck: true,
          lang: 'es',
        },
      },
    },
  },
});