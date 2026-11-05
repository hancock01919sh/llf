import type { ImageProps } from '@/blocks/types';
import { IconInstagram, IconTikTok, IconYoutube } from '../Icon';
function SocialItemWrapper({
  inPopup,
  children,
  href,
  ariaLabel,
}: {
  inPopup: boolean;
  children: React.ReactNode;
  href: string;
  ariaLabel: string;
}) {
  return (
    <a aria-label={ariaLabel} href={href} target="_blank" rel="noopener noreferrer">
      <div
        className={`${inPopup ? 'bg-surface-mint [&_svg_path]:fill-ink-terra' : 'bg-semantic-leaf [&_svg_path]:fill-surface-sand'}  rounded-[13.14px] w-14 aspect-square flex items-center justify-center  `}
      >
        {children}
      </div>
    </a>
  );
}
export interface FooterSocialLinkProps {
  Image: ImageProps;
  Label: string;
  href: string;
}
interface FooterSocialShareProps {
  iconLink: FooterSocialLinkProps[];
  inPopup: boolean;
}
export function FooterSocialShare({ iconLink, inPopup }: FooterSocialShareProps) {
  return (
    <div className="flex gap-2.75">
      {iconLink.map((item) => {
        const { Label, href } = item;
        let IconTemplate = IconInstagram;
        if (Label.toLowerCase() === 'instagram') {
          IconTemplate = IconInstagram;
        } else if (Label.toLowerCase() === 'tiktok') {
          IconTemplate = IconTikTok;
        } else if (Label.toLowerCase() === 'youtube') {
          IconTemplate = IconYoutube;
        }
        return (
          <SocialItemWrapper ariaLabel={Label} key={href} inPopup={inPopup} href={href}>
            <IconTemplate />
          </SocialItemWrapper>
        );
      })}
    </div>
  );
}
