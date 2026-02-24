import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';


window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error Caught:", { message, source, lineno, colno, error });
  // 阻止默认的错误处理，以防它阻止我们看到输出
  return true; 
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
