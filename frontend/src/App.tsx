import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Send from './pages/Send';
import Receive from './pages/Receive';
import { TransferProvider } from './context/TransferContext';

function App() {
  return (
    <TransferProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/" element={<Send />} />
          <Route path="/receive" element={<Receive />} />
        </Routes>
      </Box>
    </TransferProvider>
  );
}

export default App; 