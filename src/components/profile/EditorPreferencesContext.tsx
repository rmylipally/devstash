"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getEditorPreferences, updateEditorPreferences, type EditorPreferences } from "@/actions/editor-preferences";

interface EditorPreferencesContextType {
  preferences: EditorPreferences | null;
  isLoading: boolean;
  updatePreferences: (preferences: Partial<EditorPreferences>) => Promise<void>;
}

const DEFAULT_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  minimap: false,
  tabSize: 2,
  theme: "vs-dark",
  wordWrap: true,
};

const EditorPreferencesContext = createContext<EditorPreferencesContextType | undefined>(
  undefined,
);

export function useEditorPreferences(): EditorPreferencesContextType {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    // Return default preferences when context is not available
    return {
      isLoading: false,
      preferences: DEFAULT_PREFERENCES,
      updatePreferences: async () => {
        // No-op when context is not available
      },
    };
  }
  return context;
}

interface EditorPreferencesProviderProps {
  children: ReactNode;
}

export function EditorPreferencesContextProvider({
  children,
}: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<EditorPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const result = await getEditorPreferences();
      if (result.success) {
        setPreferences(result.data);
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
      setIsLoading(false);
    };

    loadPreferences();
  }, []);

  const updatePrefs = async (newPreferences: Partial<EditorPreferences>) => {
    setIsLoading(true);
    try {
      const result = await updateEditorPreferences(newPreferences);
      if (result.success) {
        setPreferences(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EditorPreferencesContext.Provider
      value={{
        isLoading,
        preferences,
        updatePreferences: updatePrefs,
      }}
    >
      {children}
    </EditorPreferencesContext.Provider>
  );
}
