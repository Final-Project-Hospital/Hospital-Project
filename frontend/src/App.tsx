import React from 'react';
import ConfigRoutes from './routes/mainroutes';
import { ContextProvider } from "./contexts/ContextProvider"
import { registerLicense } from '@syncfusion/ej2-base';
import { ThemeProvider } from 'styled-components';
import { theme } from './style/theme/theme';
import 'antd/dist/reset.css';



registerLicense('Ngo9BigBOggjHTQxAR8/V1NNaF1cXGNCeUx3Q3xbf1x1ZFRMY15bRHZPIiBoS35Rc0VlWHlfc3dWQ2FUVERyVEBU');

const App: React.FC = () => {
  return (
    <ContextProvider>
      <ThemeProvider theme={theme}>
        <ConfigRoutes />
      </ThemeProvider>
    </ContextProvider>
  );
};

export default App;