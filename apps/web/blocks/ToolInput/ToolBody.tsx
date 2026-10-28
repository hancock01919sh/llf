import { ModuleBoundary } from '@/components/ModuleBoundary';
import type { ToolInputProps } from '.';
import { Typography } from '@/components/Typography';
import { IconWork1, IconWork2, IconWork3 } from '@/components/Icon';
import { Anchor } from './Anchor';
import type { BlockProps } from '../types';
const IconComponent = [IconWork1, IconWork2, IconWork3];
export function ToolBody(props: BlockProps<ToolInputProps>) {
  return (
    <ModuleBoundary type="tool-body" surface="paper" className="pt-12 pb-15 lg:pb-25">
      <div className="lg:w-2/3 mx-auto lg:text-center">
        <Typography variant="headline-lg">{props.block.CardTitle}</Typography>
        <Typography variant="subhead-lg" className="mt-5">
          {props.block.CardDescription}
        </Typography>
      </div>

      <div className="flex flex-col items-center justify-center text-center gap-5  lg:flex-row lg:justify-between lg:items-start ">
        {props.block.Cards.map((card, index) => {
          const IconItem = IconComponent[index];
          return (
            <div key={card.Title} className=" flex-col flex-center gap-5 py-5 px-15 lg:w-1/3">
              {IconItem && <IconItem />}
              <Typography variant="title-card" className="text-semantic-leaf font-anton">
                {card.Title}
              </Typography>
              <Typography variant="subhead-lg">{card.Description}</Typography>
              {card?.Link?.Label && (
                <Anchor>
                  <span
                    className="text-semantic-leaf text-link cursor-pointer"
                    aria-label={card.Link.Label}
                  >
                    {card.Link.Label}
                  </span>
                </Anchor>
              )}
            </div>
          );
        })}
      </div>
    </ModuleBoundary>
  );
}
