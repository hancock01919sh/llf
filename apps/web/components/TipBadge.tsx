import { Typography } from './Typography';

const TipBadgeColorMapping = {
  'buy it': 'bg-semantic-tomato text-surface-paper',
  'store it': 'bg-semantic-squash text-ink-terra',
  'rescue it': 'bg-surface-sand text-ink-terra',
  'use it': 'bg-semantic-leaf text-surface-paper',
};
export type TipBadgeType = keyof typeof TipBadgeColorMapping;
export function TipBadge({ type, className }: { type: TipBadgeType; className?: string }) {
  return (
    <Typography
      variant="eyebrow"
      className={`pt-2 pb-2xs px-sm rounded-full w-max font-bold uppercase ${TipBadgeColorMapping[type]} ${className}`}
    >
      {type}
    </Typography>
  );
}
