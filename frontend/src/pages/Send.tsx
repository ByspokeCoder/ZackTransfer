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

      const response = await axios.post('/api/transfers', formData, {
        ...api,
        headers: {
          ...api.headers,
          'Content-Type': 'multipart/form-data',
        },
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
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
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
            label="Enter text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
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
            sx={{ mb: 2 }}
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
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected: {image.name}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !image}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Image'}
          </Button>
        </form>
      </TabPanel>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {code && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
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
  );
} 