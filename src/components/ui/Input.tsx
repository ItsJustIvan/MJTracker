'use client'
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({ label, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">
        {label}
      </label>
      <input 
        {...props}
        className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-zinc-200 focus:border-emerald-500 text-zinc-900 outline-none font-bold placeholder:text-zinc-400 transition-all focus:ring-0"
      />
    </div>
  );
}