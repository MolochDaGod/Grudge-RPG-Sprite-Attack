import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  type PuterUser,
  type PlayerData,
  type SaveGameData,
  type GameSettings,
  isPuterAvailable,
  signIn as puterSignIn,
  signOut as puterSignOut,
  isSignedIn as puterIsSignedIn,
  getUser as puterGetUser,
  saveGame as puterSaveGame,
  loadGame as puterLoadGame,
  listSaveGames as puterListSaves,
  deleteSaveGame as puterDeleteSave,
  saveSettings as puterSaveSettings,
  loadSettings as puterLoadSettings,
  getDefaultSettings,
} from "@/lib/puterAuth";

interface AuthContextValue {
  user: PuterUser | null;
  isLoading: boolean;
  isAvailable: boolean;
  currentSave: SaveGameData | null;
  settings: GameSettings;
  signIn: () => Promise<void>;
  signOut: () => void;
  saveCurrentGame: () => Promise<boolean>;
  loadSave: (playerId: string) => Promise<boolean>;
  listSaves: () => Promise<{ key: string; data: SaveGameData }[]>;
  deleteSave: (playerId: string) => Promise<boolean>;
  updatePlayer: (updates: Partial<PlayerData>) => void;
  updateSettings: (updates: Partial<GameSettings>) => Promise<void>;
  setCurrentSave: (save: SaveGameData | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function PuterAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PuterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSave, setCurrentSave] = useState<SaveGameData | null>(null);
  const [settings, setSettings] = useState<GameSettings>(getDefaultSettings());
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      const available = isPuterAvailable();
      setIsAvailable(available);
      
      if (available && puterIsSignedIn()) {
        const puterUser = await puterGetUser();
        setUser(puterUser);
        
        const savedSettings = await puterLoadSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      }
      
      setIsLoading(false);
    };
    
    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    const puterUser = await puterSignIn();
    if (puterUser) {
      setUser(puterUser);
      const savedSettings = await puterLoadSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    }
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
    puterSignOut();
    setUser(null);
    setCurrentSave(null);
    setSettings(getDefaultSettings());
  }, []);

  const saveCurrentGame = useCallback(async (): Promise<boolean> => {
    if (!currentSave) return false;
    
    const updatedSave: SaveGameData = {
      ...currentSave,
      player: {
        ...currentSave.player,
        lastPlayedAt: new Date().toISOString(),
      },
      settings,
    };
    
    const success = await puterSaveGame(updatedSave);
    if (success) {
      setCurrentSave(updatedSave);
    }
    return success;
  }, [currentSave, settings]);

  const loadSave = useCallback(async (playerId: string): Promise<boolean> => {
    const save = await puterLoadGame(playerId);
    if (save) {
      setCurrentSave(save);
      if (save.settings) {
        setSettings(save.settings);
      }
      return true;
    }
    return false;
  }, []);

  const listSaves = useCallback(async () => {
    return await puterListSaves();
  }, []);

  const deleteSave = useCallback(async (playerId: string): Promise<boolean> => {
    const success = await puterDeleteSave(playerId);
    if (success && currentSave?.player.id === playerId) {
      setCurrentSave(null);
    }
    return success;
  }, [currentSave]);

  const updatePlayer = useCallback((updates: Partial<PlayerData>) => {
    if (!currentSave) return;
    setCurrentSave({
      ...currentSave,
      player: { ...currentSave.player, ...updates },
    });
  }, [currentSave]);

  const updateSettings = useCallback(async (updates: Partial<GameSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await puterSaveSettings(newSettings);
  }, [settings]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAvailable,
    currentSave,
    settings,
    signIn,
    signOut,
    saveCurrentGame,
    loadSave,
    listSaves,
    deleteSave,
    updatePlayer,
    updateSettings,
    setCurrentSave,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function usePuterAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("usePuterAuth must be used within PuterAuthProvider");
  }
  return context;
}
