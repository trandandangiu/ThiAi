// src/hooks/useDialog.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmDialog, ConfirmVariant } from '../components/ui/ConfirmDialog';
import { PromptDialog } from '../components/ui/PromptDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  multiline?: boolean;
  required?: boolean;
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Confirm state
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  // Prompt state
  const [promptState, setPromptState] = useState<{
    options: PromptOptions;
    resolve: (value: string | null) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise(resolve => {
      setPromptState({ options, resolve });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}

      {/* Confirm Dialog */}
      {confirmState && (
        <ConfirmDialog
          isOpen
          title={confirmState.options.title}
          message={confirmState.options.message}
          confirmText={confirmState.options.confirmText}
          cancelText={confirmState.options.cancelText}
          variant={confirmState.options.variant}
          onConfirm={() => {
            confirmState.resolve(true);
            setConfirmState(null);
          }}
          onCancel={() => {
            confirmState.resolve(false);
            setConfirmState(null);
          }}
        />
      )}

      {/* Prompt Dialog */}
      {promptState && (
        <PromptDialog
          isOpen
          title={promptState.options.title}
          message={promptState.options.message}
          placeholder={promptState.options.placeholder}
          defaultValue={promptState.options.defaultValue}
          confirmText={promptState.options.confirmText}
          cancelText={promptState.options.cancelText}
          multiline={promptState.options.multiline}
          required={promptState.options.required}
          onConfirm={value => {
            promptState.resolve(value);
            setPromptState(null);
          }}
          onCancel={() => {
            promptState.resolve(null);
            setPromptState(null);
          }}
        />
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used inside DialogProvider');
  }
  return ctx;
};