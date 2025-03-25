import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Container, Box, Button, AppBar, Toolbar, Typography } from '@mui/material';
import { Send as SendIcon, Download as DownloadIcon } from '@mui/icons-material';
import Send from './pages/Send';
import Receive from './pages/Receive';
import { APP_NAME } from './api/config';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSendPage = location.pathname === '/';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {APP_NAME}
          </Typography>
          <Button
            color="inherit"
            startIcon={<SendIcon />}
            onClick={() => navigate('/')}
            variant={isSendPage ? 'outlined' : 'text'}
          >
            Send
          </Button>
          <Button
            color="inherit"
            startIcon={<DownloadIcon />}
            onClick={() => navigate('/receive')}
            variant={!isSendPage ? 'outlined' : 'text'}
          >
            Receive
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Send />} />
          <Route path="/receive" element={<Receive />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App; 