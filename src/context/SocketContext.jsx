import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const watchVideo = (videoId) => {
    socketRef.current?.emit('watch_video', videoId);
  };

  const onProgress = (cb) => {
    socketRef.current?.on('progress', cb);
    return () => socketRef.current?.off('progress', cb);
  };

  const onComplete = (cb) => {
    socketRef.current?.on('complete', cb);
    return () => socketRef.current?.off('complete', cb);
  };

  return (
    <SocketContext.Provider value={{ connected, watchVideo, onProgress, onComplete, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);