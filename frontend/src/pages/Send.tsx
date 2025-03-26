import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PhotoCamera, TextFields, Timer } from '@mui/icons-material';
import axios from 'axios';
import { api } from '../api/config';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Send() {
  const [tabValue, setTabValue] = useState(0);
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setCode(null);
      setTimeLeft(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setText('');
    setImage(null);
    setCode(null);
    setError(null);
    setTimeLeft(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (tabValue === 0) {
        formData.append('content', text);
        formData.append('type', 'text');
      } else if (image) {
        formData.append('image', image);
        formData.append('type', 'image');
      }

      const response = await axios.post(`${api.baseURL}/api/transfers`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: api.timeout,
      });

      setCode(response.data.code);
      setTimeLeft(60);
    } catch (err) {
      setError('Failed to create transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#1C1C1C',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pt: 4,
      px: 3
    }}>
      <Box sx={{ 
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ 
          color: 'white', 
          fontWeight: 500,
          fontFamily: "'BM Hanna 11yrs old', sans-serif"
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
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%',
          maxWidth: '600px',
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          alignSelf: 'center'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white',
                },
              },
            }}
          >
            <Tab icon={<TextFields />} label="Text" />
            <Tab icon={<PhotoCamera />} label="Image" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Enter text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  '&:hover': {
                    bgcolor: 'white',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                  }
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ 
                mt: 2,
                bgcolor: '#1C1C1C',
                '&:hover': {
                  bgcolor: '#2C2C2C'
                }
              }}
              disabled={loading || !text}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Text'}
            </Button>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handleSubmit}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ 
                mb: 2,
                borderColor: 'rgba(255, 255, 255, 0.23)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                }
              }}
              disabled={loading}
            >
              Choose Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </Button>
            {image && (
              <Typography variant="body2" sx={{ mb: 2, color: 'white' }}>
                Selected: {image.name}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ 
                bgcolor: '#1C1C1C',
                '&:hover': {
                  bgcolor: '#2C2C2C'
                }
              }}
              disabled={loading || !image}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Image'}
            </Button>
          </form>
        </TabPanel>

        {error && (
          <Alert severity="error" sx={{ mx: 3, mb: 3 }}>
            {error}
          </Alert>
        )}

        {code && (
          <Alert 
            severity="success" 
            sx={{ mx: 3, mb: 3 }}
            icon={<Timer />}
          >
            <Box>
              <Typography variant="body1">
                Your code is: <strong>{code}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires in: {timeLeft} seconds
              </Typography>
            </Box>
          </Alert>
        )}
      </Paper>
    </Box>
  );
} 