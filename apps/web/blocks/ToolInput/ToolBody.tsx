import { Typography } from '@/components/Typography';
import { IconWork1, IconWork2, IconWork3 } from '@/components/Icon';
import { Anchor } from './Anchor';
import type { BlockProps } from '../types';
import type { cmsType } from '@llf/contracts';
const IconComponent = [IconWork1, IconWork2, IconWork3];
export function ToolBody(props: BlockProps<cmsType.component.ToolInputDeepRef>) {
  return (
    <div className="px-gutter lg:px-gutter-lg max-w-page mx-auto pt-12 pb-15 lg:pb-25">
      <div className="lg:w-2/3 mx-auto text-center">
        <Typography variant="headline-lg">{props.block.cardTitle}</Typography>
        <Typography variant="subhead-lg" className="mt-5">
          {props.block.cardDescription}
        </Typography>
      </div>

      <div className="flex flex-col items-center justify-center text-center gap-5  lg:flex-row lg:justify-between lg:items-start ">
        {props.block.cards?.map((card, index) => {
          const IconItem = IconComponent[index];
          return (
            <div key={card.title} className=" flex-col flex-center gap-5 py-5 px-15 lg:w-1/3">
              {IconItem && <IconItem />}
              <Typography variant="title-card" className="text-semantic-leaf font-anton">
                {card.title}
              </Typography>
              <Typography variant="subhead-lg">{card.description}</Typography>
              {card?.link?.label && (
                <Anchor>
                  <span
                    className="text-semantic-leaf text-link cursor-pointer"
                    aria-label={card.link.label}
                  >
                    {card.link.label}
                  </span>
                </Anchor>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
