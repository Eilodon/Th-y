import React, { useEffect, useState } from 'react';
import { ZenResponse } from '../types';

interface Props {
  data: ZenResponse;
}

export const QuoteCard: React.FC<Props> = ({ data }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(data.wisdom_vi.slice(0, i));
      i++;
      if (i > data.wisdom_vi.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [data]);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-orange-500/20 p-8 max-w-md mx-4 animate-[fadeIn_300ms_ease-out]">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium uppercase tracking-wider">
          {data.emotion}
        </span>
        {data.breathing && (
          <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-medium uppercase tracking-wider">
             Thở {data.breathing}
          </span>
        )}
      </div>
      
      <p className="font-serif text-2xl leading-loose text-stone-800 mb-6 min-h-[120px]">
        {displayedText}
      </p>
      
      <p className="text-right text-stone-600 italic font-serif">
        — Thích Nhất Hạnh
      </p>
    </div>
  );
};