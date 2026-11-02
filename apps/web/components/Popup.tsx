'use client';

import { useState } from 'react';

const ANIMATION_CLASS_MAP = {
  translate: {
    enter: 'translate-enter',
    exit: 'translate-exit',
  },
  opacity: {
    enter: 'opacity-enter',
    exit: 'opacity-exit',
  },
};

export function Popup({
  children,
  open = false,
  onClose = () => {},
  animationClass = 'translate',
  className = '',
}: {
  children: React.ReactNode;
  animationClass?: keyof typeof ANIMATION_CLASS_MAP;
  open?: boolean;
  onClose?: () => void;
  className?: string;
}) {
  const [isRendered, setIsRendered] = useState(open);
  if (open && !isRendered) {
    setIsRendered(true);
  }

  const animation = ANIMATION_CLASS_MAP[animationClass];

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !open) {
      setIsRendered(false);
    }
  };

  if (!isRendered) {
    return null;
  }

  return (
    <div className={`popup-container fixed inset-0 w-full h-full z-1 `}>
      <button
        type="button"
        aria-label="Close"
        className={`block w-full h-full bg-[rgba(0,0,0,0.3)]  ${open ? 'opacity-enter' : 'opacity-exit'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 z-1 w-full overflow-y-auto max-h-full overscroll-y-none  ${
          open ? animation.enter : animation.exit
        } ${className}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </div>
    </div>
  );
}
