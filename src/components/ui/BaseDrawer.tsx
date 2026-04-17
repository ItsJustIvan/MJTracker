'use client'
import React from 'react';

interface BaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BaseDrawer({ isOpen, onClose, children, title }: BaseDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity z-[100] 
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      
      {/* Drawer Body */}
      <div className={`fixed inset-x-0 bottom-0 z-[110] bg-white rounded-t-[3rem] transition-transform duration-500 transform 
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Swipe/Close Handle */}
        <div className="w-full flex flex-col items-center pt-4 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-zinc-200 rounded-full cursor-pointer" />
        </div>

        <div className="max-w-md mx-auto px-8 pb-12 space-y-6">
          {title && (
            <div className="flex justify-between items-end border-b border-zinc-50 pb-4">
               <h2 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter truncate">{title}</h2>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}