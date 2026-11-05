import type { cmsType } from '@llf/contracts';

export function FooterLinks({ overlayLink }: { overlayLink: cmsType.shared.OverlayLink[] }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {overlayLink?.map((item) => (
        <a
          href={item.href || '#'}
          key={item.label}
          className="underline text-subhead-sm cursor-pointer"
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
