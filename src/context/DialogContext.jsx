import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, HelpCircle, MessageSquare, Check, X } from 'lucide-react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogConfig, setDialogConfig] = useState(null);

  const closeDialog = useCallback((result) => {
    if (dialogConfig?.resolve) {
      dialogConfig.resolve(result);
    }
    setDialogConfig(null);
  }, [dialogConfig]);

  const alert = useCallback((message, title = 'Pemberitahuan') => {
    return new Promise((resolve) => {
      setDialogConfig({ type: 'alert', title, message, resolve });
    });
  }, []);

  const confirm = useCallback((message, title = 'Konfirmasi') => {
    return new Promise((resolve) => {
      setDialogConfig({ type: 'confirm', title, message, resolve });
    });
  }, []);

  const prompt = useCallback((message, defaultValue = '', title = 'Input Data') => {
    return new Promise((resolve) => {
      setDialogConfig({ type: 'prompt', title, message, defaultValue, resolve });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      {/* RENDER FLOATING MODAL DENGAN BACKDROP BLUR */}
      {dialogConfig && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/60 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 text-slate-100 animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                {dialogConfig.type === 'alert' && <AlertCircle className="w-6 h-6" />}
                {dialogConfig.type === 'confirm' && <HelpCircle className="w-6 h-6" />}
                {dialogConfig.type === 'prompt' && <MessageSquare className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{dialogConfig.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{dialogConfig.message}</p>
              </div>
            </div>

            {dialogConfig.type === 'prompt' && (
              <input
                type="text"
                id="dialog-prompt-input"
                defaultValue={dialogConfig.defaultValue}
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400 mb-5"
              />
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              {dialogConfig.type !== 'alert' && (
                <button
                  onClick={() => closeDialog(dialogConfig.type === 'prompt' ? null : false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Batal
                </button>
              )}

              <button
                onClick={() => {
                  if (dialogConfig.type === 'prompt') {
                    const inputVal = document.getElementById('dialog-prompt-input')?.value;
                    closeDialog(inputVal);
                  } else {
                    closeDialog(true);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-500 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog harus digunakan di dalam <DialogProvider>');
  }
  return context;
}