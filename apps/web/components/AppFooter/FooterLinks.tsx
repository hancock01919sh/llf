export interface FooterLinkProps {
  Overlay_description: string | null;
  Label: string;
  href: string | null;
}
export function FooterLinks({ overlayLink }: { overlayLink: FooterLinkProps[] }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {overlayLink?.map((item) => (
        <a
          href={item.href || '#'}
          key={item.Label}
          className="underline text-subhead-sm cursor-pointer"
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.Label}
        </a>
      ))}
    </div>
  );
}
