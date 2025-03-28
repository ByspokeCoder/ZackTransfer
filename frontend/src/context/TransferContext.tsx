import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { api } from '../api/config';

interface TransferContextType {
  code: string | null;
  timeLeft: number | null;
  isRead: boolean;
  readAt: string | null;
  email: string;
  setTransferState: (code: string, email: string) => void;
  resetTransferState: () => void;
  setEmail: (email: string) => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export function TransferProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRead, setIsRead] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setCode(null);
      setTimeLeft(null);
      setIsRead(false);
      setReadAt(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft]);

  useEffect(() => {
    let checkStatus: NodeJS.Timeout;
    if (code && timeLeft && timeLeft > 0) {
      checkStatus = setInterval(async () => {
        try {
          console.log('Polling transfer status for code:', code);
          const response = await axios.get(`${api.baseURL}/api/transfers/${code}`);
          console.log('Poll response:', response.data);
          
          if (response.data.isRead) {
            console.log('Transfer marked as read, updating state');
            setIsRead(true);
            if (response.data.readAt) {
              const readTimestamp = new Date(response.data.readAt).toLocaleString();
              console.log('Setting read timestamp:', readTimestamp);
              setReadAt(readTimestamp);
            }
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
      }, 2000);
    }
    return () => {
      if (checkStatus) clearInterval(checkStatus);
    };
  }, [code, timeLeft]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const setTransferState = (newCode: string, newEmail: string) => {
    setCode(newCode);
    setTimeLeft(60);
    setIsRead(false);
    setReadAt(null);
    setEmail(newEmail);
  };

  const resetTransferState = () => {
    setCode(null);
    setTimeLeft(null);
    setIsRead(false);
    setReadAt(null);
    setEmail('');
  };

  return (
    <TransferContext.Provider 
      value={{ 
        code, 
        timeLeft, 
        isRead, 
        readAt, 
        email,
        setTransferState,
        resetTransferState,
        setEmail
      }}
    >
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const context = useContext(TransferContext);
  if (context === undefined) {
    throw new Error('useTransfer must be used within a TransferProvider');
  }
  return context;
} 