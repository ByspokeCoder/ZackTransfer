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
import { Link } from 'react-router-dom';
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
  const [email, setEmail] = useState('');
  const [isRead, setIsRead] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);

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

  useEffect(() => {
    let checkStatus: NodeJS.Timeout;
    if (code && !isRead && timeLeft && timeLeft > 0) {
      checkStatus = setInterval(async () => {
        try {
          const response = await axios.get(`${api.baseURL}/api/transfers/${code}`);
          if (response.data.isRead) {
            setIsRead(true);
            setReadAt(new Date().toLocaleString());
            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Transfer Read!', {
                body: `Your transfer (${code}) has been read.`,
                icon: '/images/Logo1.png'
              });
            }
          }
        } catch (error) {
          console.error('Error checking read status:', error);
        }
      }, 2000); // Check every 2 seconds
    }
    return () => {
      if (checkStatus) clearInterval(checkStatus);
    };
  }, [code, isRead, timeLeft]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Don't reset state when switching tabs
    if (code === null) {
      setText('');
      setImage(null);
      setError(null);
    }
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
      if (email) {
        formData.append('email', email);
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
      console.error('Error creating transfer:', err);
      setError('Failed to create transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#FDF7F2',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pt: 4,
      px: 3
    }}>
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
          <Typography variant="h4" sx={{ 
            color: '#1C1C1C', 
            fontWeight: 600,
            letterSpacing: '-0.5px',
            fontFamily: 'var(--system-font-display)'
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
      
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%',
          maxWidth: '600px',
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          alignSelf: 'center'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 0, 0, 0.1)' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(0, 0, 0, 0.6)',
                '&.Mui-selected': {
                  color: '#C17F59',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#C17F59',
              }
            }}
          >
            <Tab icon={<TextFields />} label="Text" />
            <Tab icon={<PhotoCamera />} label="Image" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    bgcolor: '#F8F8F8',
                    '&:hover': {
                      bgcolor: '#F8F8F8',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#F8F8F8',
                      '& fieldset': {
                        borderColor: '#C17F59',
                      }
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                type="email"
                variant="outlined"
                placeholder="Your email (optional, for read receipt)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#F8F8F8',
                    '&:hover': {
                      bgcolor: '#F8F8F8',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#F8F8F8',
                      '& fieldset': {
                        borderColor: '#C17F59',
                      }
                    }
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ 
                  bgcolor: '#C17F59',
                  '&:hover': {
                    bgcolor: '#A66B48'
                  },
                  textTransform: 'none',
                  borderRadius: '8px',
                  py: 1.5
                }}
                disabled={loading || !text}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Text'}
              </Button>
            </Box>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ 
                  borderColor: '#C17F59',
                  color: '#C17F59',
                  '&:hover': {
                    borderColor: '#A66B48',
                    bgcolor: 'rgba(193, 127, 89, 0.04)'
                  },
                  textTransform: 'none',
                  borderRadius: '8px',
                  py: 1.5
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
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Selected: {image.name}
                </Typography>
              )}
              <TextField
                fullWidth
                type="email"
                variant="outlined"
                placeholder="Your email (optional, for read receipt)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#F8F8F8',
                    '&:hover': {
                      bgcolor: '#F8F8F8',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#F8F8F8',
                      '& fieldset': {
                        borderColor: '#C17F59',
                      }
                    }
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ 
                  bgcolor: '#C17F59',
                  '&:hover': {
                    bgcolor: '#A66B48'
                  },
                  textTransform: 'none',
                  borderRadius: '8px',
                  py: 1.5
                }}
                disabled={loading || !image}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Image'}
              </Button>
            </Box>
          </form>
        </TabPanel>

        {error && (
          <Alert severity="error" sx={{ mx: 3, mb: 3 }}>
            {error}
          </Alert>
        )}

        {code && (
          <Alert 
            severity={isRead ? "info" : "success"}
            sx={{ 
              mx: 3, 
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1
            }}
          >
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>Transfer Code: <strong>{code}</strong></Typography>
              {timeLeft !== null && timeLeft > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timer fontSize="small" />
                  <Typography>{timeLeft}s</Typography>
                </Box>
              )}
            </Box>
            {isRead && (
              <Typography variant="body2" color="textSecondary">
                Read at: {readAt} UTC
              </Typography>
            )}
          </Alert>
        )}
      </Paper>
    </Box>
  );
} 