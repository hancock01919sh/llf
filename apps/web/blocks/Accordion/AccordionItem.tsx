import { IconArrow } from '@/components/Icon';
import { Typography } from '@/components/Typography';
import type { cmsType } from '@llf/contracts';

export function AccordionItemComponent({
  label,
  description,
  index,
  isExpanded,
  toggleIsExpanded,
}: cmsType.shared.AccordionItem & {
  index: number;
  isExpanded: boolean;
  toggleIsExpanded: (isExpanded: boolean) => void;
}) {
  // Labels contain spaces, which aren't valid in an id, so key the aria wiring on the index.
  const headerId = `accordion-header-${index}`;
  const panelId = `accordion-panel-${index}`;
  return (
    <div
      className={` font-bold w-full flex flex-col p-5 lg:p-lg rounded-sm mx-auto transition-colors duration-300 ${isExpanded ? 'bg-surface-paper' : 'bg-surface-sand'}`}
    >
      <button
        className="w-full flex justify-between items-center cursor-pointer"
        id={headerId}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => toggleIsExpanded(!isExpanded)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleIsExpanded(!isExpanded);
          }
        }}
      >
        <Typography variant="subhead-lg">{label}</Typography>
        <IconArrow point={isExpanded ? 'up' : 'down'} />
      </button>

      <div
        className={`grid overflow-hidden transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        aria-hidden={!isExpanded}
      >
        <Typography
          variant="paragraph-sm"
          className={`lg:text-paragraph-lg min-h-0 transition-all duration-300 ${isExpanded ? 'mt-4 lg:mt-6  ' : 'opacity-0'}`}
        >
          {description}
        </Typography>
      </div>
    </div>
  );
}
