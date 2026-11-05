import { Typography } from '@/components/Typography';
import type { BlockProps } from '@/blocks/types';
import type { cmsType } from '@llf/contracts';
export function CategoryEmoji(props: BlockProps<cmsType.component.CategoryEmoji>) {
  const { title, description, emoji } = props.block;
  return (
    <div className="py-15 lg:py-25">
      <div className="lg:w-[60%] lg:mx-auto text-center">
        <Typography variant="headline-lg" className="uppercase">
          {title}
        </Typography>
        <Typography variant="subhead-lg" className="mt-lg">
          {description}
        </Typography>
      </div>
      <div className="w-full mt-11.25 lg:max-w-332 lg:mx-auto">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {emoji.map((item) => (
            <div
              key={item.title}
              className=" aspect-square border border-brand-forestflex items-center flex! flex-col justify-center rounded-md text-center lg:w-51 lg:h-51 px-2"
            >
              <span className="text-[88px] leading-[1.1]">{item.emoji}</span>
              <Typography variant="label" className="lg:text-subhead-sm">
                {item.title}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
