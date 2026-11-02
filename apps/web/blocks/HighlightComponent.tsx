import { BlockBaseSchema, LinkSchema, type BlockProps } from '@/blocks/types';
import { SurfaceSchema } from '@/components/ModuleBoundary';
import TransitionLink from '@/components/TransitionLink';
import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import { Media } from '@llf/contracts/cms';
import z from 'zod';
export const HighlightComponentSchema = BlockBaseSchema.extend({
  Background_color: SurfaceSchema,
  Image: Media,
  Link: z.array(LinkSchema).default([]),
});
export type BlockHighlightComponent = z.infer<typeof HighlightComponentSchema>;
export function HighlightComponent(props: BlockProps<BlockHighlightComponent>) {
  const { Image: backgroundImage, Link, Title, Description } = props.block;
  return (
    <section
      className={`w-full text-surface-paper lg:aspect-1440/865 lg:px-[5.625%] lg:py-[6.94%] `}
    >
      <div
        className={`relative w-full h-full lg:rounded-[35px] overflow-hidden aspect-402/725 mx-auto max-w-page  `}
      >
        <UIImage {...backgroundImage} className="absolute w-full h-full" />
        <div
          className={`absolute inset-0 bg-[rgba(0,0,0,0.2)] lg:bg-black/30 flex flex-col items-center text-center justify-center px-5 lg:px-[19%]`}
        >
          <Typography variant="headline-lg" className="uppercase lg:text-headline-xl">
            {Title}
          </Typography>
          <Typography variant="subhead-lg" className="lg:font-normal mt-3 lg:mt-5">
            {Description}
          </Typography>
          {Link.filter((l) => l.isDisplay).map((l) => {
            return (
              <TransitionLink
                key={l.Label}
                className={`${l.Buttontype === 'Primary' ? 'btn' : 'link'} mt-5`}
                href={l.href as string}
              >
                {l.Label}
              </TransitionLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
