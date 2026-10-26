"use client";

interface DeleteButtonProps {
  confirmMessage: string;
  title: string;
}

export default function DeleteButton({ confirmMessage, title }: DeleteButtonProps) {
  return (
    <button
      type="submit"
      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
      title={title}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <span className="material-symbols-outlined text-base" aria-hidden="true">
        delete
      </span>
    </button>
  );
}
