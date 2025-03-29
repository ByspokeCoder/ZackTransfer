import { Box, Typography, Button, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <Box sx={{ 
      mb: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3
    }}>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <a 
          href="https://www.zacktransfer.com"
          style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: 'inherit'
          }}
        >
          <Typography variant="h4" sx={{ 
            color: '#1C1C1C', 
            fontWeight: 600,
            letterSpacing: '-0.5px',
            fontFamily: 'var(--system-font-display)',
            '&:hover': {
              color: '#C17F59'
            }
          }}>
            ZackTransfer
          </Typography>
          <img 
            src="/images/Logo1.png" 
            alt="ZackTransfer Logo" 
            style={{ 
              width: '40px',
              height: 'auto'
            }} 
          />
        </a>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          component={Link}
          to="/"
          sx={{ 
            bgcolor: '#C17F59',
            '&:hover': {
              bgcolor: '#A66B48'
            },
            textTransform: 'none',
            borderRadius: '8px',
            px: 4,
            py: 1
          }}
        >
          Send
        </Button>
        <Button
          variant="outlined"
          component={Link}
          to="/receive"
          sx={{ 
            borderColor: '#C17F59',
            color: '#C17F59',
            '&:hover': {
              borderColor: '#A66B48',
              bgcolor: 'rgba(193, 127, 89, 0.04)'
            },
            textTransform: 'none',
            borderRadius: '8px',
            px: 4,
            py: 1
          }}
        >
          Receive
        </Button>
      </Box>
    </Box>
  );
} 