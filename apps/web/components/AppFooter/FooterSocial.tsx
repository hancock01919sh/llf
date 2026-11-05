import { IconInstagram, IconTikTok, IconYoutube } from '../Icon';
import type { cmsType } from '@llf/contracts';
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
interface FooterSocialShareProps {
  iconLink: cmsType.shared.Iconlink[];
  inPopup: boolean;
}
export function FooterSocialShare({ iconLink, inPopup }: FooterSocialShareProps) {
  return (
    <div className="flex gap-2.75">
      {iconLink.map((item) => {
        const { label, href } = item;
        let IconTemplate = IconInstagram;
        if (label.toLowerCase() === 'instagram') {
          IconTemplate = IconInstagram;
        } else if (label.toLowerCase() === 'tiktok') {
          IconTemplate = IconTikTok;
        } else if (label.toLowerCase() === 'youtube') {
          IconTemplate = IconYoutube;
        }
        return (
          <SocialItemWrapper ariaLabel={label} key={href} inPopup={inPopup} href={href || ''}>
            <IconTemplate />
          </SocialItemWrapper>
        );
      })}
    </div>
  );
}
