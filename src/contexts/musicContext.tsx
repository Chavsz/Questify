import { createContext, useContext, useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import titleScreenBgm from '../assets/Final Fantasy VII Remake - Title Screen.mp3';

interface MusicContextType {
  pauseMainMusic: () => void;
  resumeMainMusic: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(titleScreenBgm);
    audio.loop = true;
    audio.volume = 0.5;
    musicRef.current = audio;
    audio.play().catch(() => {/* autoplay blocked */});
    
    return () => {
      audio.pause();
      audio.src = '';
      musicRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!musicRef.current) return;
    musicRef.current.muted = isMuted;
    if (isMuted) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  const pauseMainMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
    }
  };

  const resumeMainMusic = () => {
    if (musicRef.current && !isMuted) {
      musicRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    setIsMuted(m => !m);
  };

  return (
    <MusicContext.Provider value={{ pauseMainMusic, resumeMainMusic, isMuted, toggleMute }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
};
