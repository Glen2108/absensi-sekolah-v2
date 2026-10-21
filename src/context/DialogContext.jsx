import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, HelpCircle, MessageSquare, X } from 'lucide-react';

const DialogContext = createContext(null);

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const closeDialog = useCallback((result) => {
    if (dialog?.resolve) dialog.resolve(result);
    setDialog(null);
    setInputValue('');
  }, [dialog]);

  const showAlert = useCallback((message, title = 'Pemberitahuan') => {
    return new Promise((resolve) => setDialog({ type: 'alert', title, message, resolve }));
  }, []);

  const showConfirm = useCallback((message, title = 'Konfirmasi') => {
    return new Promise((resolve) => setDialog({ type: 'confirm', title, message, resolve }));
  }, []);

  const showPrompt = useCallback((message, defaultValue = '', title = 'Input Data') => {
    setInputValue(defaultValue);
    return new Promise((resolve) => setDialog({ type: 'prompt', title, message, defaultValue, resolve }));
  }, []);

  return (
    <DialogContext.Provider value={{ alert: showAlert, confirm: showConfirm, prompt: showPrompt }}>
      {children}
      
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-6 bg-slate-900/90 border border-slate-700/60 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 animate-scale-up">
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
                  {dialog.type === 'alert' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
                  {dialog.type === 'confirm' && <HelpCircle className="w-6 h-6 text-blue-400" />}
                  {dialog.type === 'prompt' && <MessageSquare className="w-6 h-6 text-emerald-400" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{dialog.title}</h3>
              </div>
              <button 
                onClick={() => closeDialog(dialog.type === 'prompt' ? null : false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 mb-5 leading-relaxed text-sm">{dialog.message}</p>

            {dialog.type === 'prompt' && (
              <div className="mb-6">
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && closeDialog(inputValue)}
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 text-sm transition-all"
                  placeholder="Ketik jawaban di sini..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {dialog.type !== 'alert' && (
                <button
                  onClick={() => closeDialog(dialog.type === 'prompt' ? null : false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => closeDialog(dialog.type === 'prompt' ? inputValue : true)}
                className="px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg transition-all"
              >
                {dialog.type === 'alert' ? 'Mengerti' : 'Lanjutkan'}
              </button>
            </div>

          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog harus digunakan di dalam DialogProvider');
  return context;
};