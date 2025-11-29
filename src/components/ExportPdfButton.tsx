import React from "react";

interface Props {
  disabled?: boolean;
  onClick: () => void;
}

const ExportPdfButton: React.FC<Props> = ({ disabled, onClick }) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold transition disabled:bg-slate-600 disabled:text-slate-400"
    >
      Xuất PDF
    </button>
  );
};

export default ExportPdfButton;
