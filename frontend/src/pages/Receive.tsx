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
    <Paper elevation={3} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={loading}
          required
          inputProps={{ maxLength: 6 }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
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
          <Typography variant="h6" gutterBottom>
            Content:
          </Typography>
          {content.type === 'text' ? (
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
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
                    overflowWrap: 'break-word'
                  }}
                >
                  {content.content}
                </Typography>
                <IconButton
                  onClick={() => handleCopy(content.content)}
                  color={copySuccess ? "success" : "primary"}
                  sx={{ ml: 1 }}
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
                style={{ maxWidth: '100%', height: 'auto', marginBottom: '16px' }}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(content.content, `${APP_NAME.toLowerCase()}-image-${code}.jpg`)}
                >
                  Download Image
                </Button>
                <Link 
                  href={content.content} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ textDecoration: 'none' }}
                >
                  Open in new tab
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
} 