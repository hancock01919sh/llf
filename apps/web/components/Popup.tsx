'use client';
import { Dialog } from 'radix-ui';
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

export const Popup = ({
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
}) => {
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
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay
          onClick={onClose}
          className={`fixed inset-0 bg-[rgba(0,0,0,0.3)] ${open ? 'opacity-enter' : 'opacity-exit'}`}
        />
        <Dialog.Content
          className={`fixed bottom-0 left-0 z-1 w-full overflow-y-auto h-auto max-h-full overscroll-y-none lg:top-1/2 lg:translate-y-[-50%]   ${
            open ? animation.enter : animation.exit
          } ${className}`}
          onAnimationEnd={handleAnimationEnd}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
