import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Link,
  IconButton,
} from '@mui/material';
import { Download as DownloadIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import axios from 'axios';
import { APP_NAME } from '../api/config';
import { api } from '../api/config';

export default function Receive() {
  const [code, setCode] = useState('');
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setContent(null);

    try {
      const response = await axios.get(`${api.baseURL}/api/transfers/${code}`, {
        timeout: api.timeout
      });
      setContent(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to retrieve content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await axios.get(url, { 
        responseType: 'blob',
        timeout: api.timeout
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text:', err);
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
            variant="outlined"
            href="/"
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
            Send
          </Button>
          <Button
            variant="contained"
            href="/receive"
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
            Receive
          </Button>
        </Box>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          width: '100%',
          maxWidth: '600px',
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          alignSelf: 'center'
        }}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            required
            inputProps={{ maxLength: 6 }}
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
              mt: 2,
              bgcolor: '#C17F59',
              '&:hover': {
                bgcolor: '#A66B48'
              },
              textTransform: 'none',
              borderRadius: '8px',
              py: 1.5
            }}
            disabled={loading || !code}
          >
            {loading ? <CircularProgress size={24} /> : 'Retrieve Content'}
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {content && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1C1C1C' }}>
              Content:
            </Typography>
            {content.type === 'text' ? (
              <Box sx={{ bgcolor: '#F8F8F8', p: 2, borderRadius: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 1,
                  width: '100%'
                }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      flex: 1,
                      overflowWrap: 'break-word',
                      color: '#1C1C1C'
                    }}
                  >
                    {content.content}
                  </Typography>
                  <IconButton
                    onClick={() => handleCopy(content.content)}
                    color={copySuccess ? "success" : "default"}
                    sx={{ 
                      ml: 1,
                      color: copySuccess ? '#4CAF50' : '#C17F59'
                    }}
                    title="Copy to clipboard"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box>
                <img
                  src={content.content}
                  alt="Received"
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto', 
                    marginBottom: '16px',
                    borderRadius: '8px'
                  }}
                />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(content.content, `${APP_NAME.toLowerCase()}-image-${code}.jpg`)}
                    sx={{ 
                      bgcolor: '#C17F59',
                      '&:hover': {
                        bgcolor: '#A66B48'
                      },
                      textTransform: 'none',
                      borderRadius: '8px',
                      py: 1.5
                    }}
                  >
                    Download Image
                  </Button>
                  <Link 
                    href={content.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      textDecoration: 'none',
                      color: '#C17F59',
                      '&:hover': {
                        color: '#A66B48'
                      }
                    }}
                  >
                    Open in new tab
                  </Link>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
} 