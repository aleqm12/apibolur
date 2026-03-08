import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7A1E3A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#102A43',
      contrastText: '#FFFFFF',
    },
    primaryLight: {
      main: '#102A43',
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