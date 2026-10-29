import { IconArrow } from '@/components/Icon';
import { Typography } from '@/components/Typography';
import type { TAccordionItem } from './index';

export function AccordionItemComponent({
  Label,
  Description,
  isExpanded,
  toggleIsExpanded,
}: TAccordionItem & {
  isExpanded: boolean;
  toggleIsExpanded: (isExpanded: boolean) => void;
}) {
  return (
    <div
      className={` font-bold w-full flex flex-col cursor-pointer p-5 lg:p-lg rounded-sm mx-auto transition-colors duration-300 ${isExpanded ? 'bg-surface-paper' : 'bg-surface-sand'}`}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onClick={() => toggleIsExpanded(!isExpanded)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleIsExpanded(!isExpanded);
        }
      }}
    >
      <div className="w-full flex justify-between items-center">
        <Typography variant="subhead-lg">{Label}</Typography>
        <IconArrow point={isExpanded ? 'up' : 'down'} />
      </div>
      <div
        className={`grid overflow-hidden transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <Typography
          variant="paragraph-sm"
          className={`lg:text-paragraph-lg min-h-0 transition-all duration-300 ${isExpanded ? 'mt-4 lg:mt-6  ' : 'opacity-0'}`}
        >
          {Description}
        </Typography>
      </div>
    </div>
  );
}
