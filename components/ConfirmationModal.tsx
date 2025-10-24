import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel, confirmText = 'Xóa', cancelText = 'Hủy' }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-slate-700">
        <h3 className="text-xl font-bold text-red-400">{title}</h3>
        <p className="text-slate-300 mt-2 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition-colors text-white"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md font-semibold transition-colors text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
