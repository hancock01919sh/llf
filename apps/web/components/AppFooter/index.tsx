'use client';
import { IconLongArrow } from '../Icon';
import { FooterSocialShare } from './FooterSocial';
import { FooterLinks } from './FooterLinks';
import TransitionLink from '../TransitionLink';
import { AppContext } from '@/components/Provider';
import { useContext } from 'react';
interface FooterProp {
  inPopup?: boolean;
  inMenu?: boolean;
  className?: string;
}
export function AppFooter({ inPopup = false, inMenu = false, className = '' }: FooterProp) {
  const { footer } = useContext(AppContext);
  if (!footer) return null;
  return (
    <footer className={`footer-container text-ink-terra ${className}`}>
      {!inPopup && (
        <div
          className={`bg-ink-terra text-surface-mint text-[35px] py-16.5 px-5 lg:px-15 lg:py-25 lg:text-lg-headline-lg`}
        >
          <TransitionLink href="/">{footer.title}</TransitionLink>
        </div>
      )}
      <div
        className={`${inPopup ? 'h-full flex flex-col justify-between pb-10' : 'pb-10 lg:py-15'}`}
      >
        <div className={`${inPopup ? 'mt-6.75' : ''}`}>
          {footer.link?.map((item) => (
            <TransitionLink
              href={`${item.href}`}
              key={item.href}
              className={`flex justify-between items-center py-3.5 border-b ${inPopup ? 'border-[#4F4B43]!' : ''} border-current px-gutter lg:px-gutter-lg `}
            >
              <span className="text-headline-md uppercase lg:text-headline-md">{item.label}</span>
              <IconLongArrow point="right" className={`[&_path]:fill-current lg:w-lg lg:h-lg `} />
            </TransitionLink>
          ))}
        </div>
        <div>
          <div className={`mt-lg px-gutter  text-inherit  lg:px-gutter-lg`}>
            <div className="w-full flex flex-col gap-lg lg:flex-row  lg:items-center justify-between">
              <FooterSocialShare iconLink={footer.iconLink} inPopup={inPopup} />
              {!inMenu && <FooterLinks overlayLink={footer.overlayLink} />}
            </div>
          </div>
          <div className="mt-lg px-gutter text-caption">{footer.legalCopy}</div>
        </div>
      </div>
    </footer>
  );
}
