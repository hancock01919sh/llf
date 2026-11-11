import { type BlockProps } from '@/blocks/types';
import { BlockTitle } from '@/components/BlockTitle';
import TransitionLink from '@/components/TransitionLink';
import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';
export function BlockHighlightComponent(props: BlockProps<cmsType.component.HighlightComponent>) {
  const { desktopImage, mobileImage, link, title, description } = props.block;

  return (
    <div className={`w-full text-surface-paper lg:aspect-1440/865 lg:px-20 lg:py-[6.94%] `}>
      <div
        className={`relative w-full h-full lg:rounded-[35px] overflow-hidden aspect-402/725 mx-auto max-w-page  `}
      >
        <UIImage
          src={desktopImage?.url || ''}
          alt={desktopImage?.alternativeText || desktopImage?.name || title.copy || ''}
          className="hidden lg:block absolute w-full h-full"
        />
        <UIImage
          src={mobileImage?.url || desktopImage?.url || ''}
          alt={mobileImage?.alternativeText || desktopImage?.alternativeText || title.copy || ''}
          className="lg:hidden absolute w-full h-full"
        />
        <div
          className={`absolute inset-0 bg-[rgba(0,0,0,0.2)] lg:bg-black/30 flex flex-col items-center text-center justify-center px-5 lg:px-[19%]`}
        >
          {/* <Typography variant="headline-lg" className="uppercase lg:text-headline-xl">
            {title}
          </Typography> */}
          <BlockTitle title={title!} moduleIndex={props.index} />
          <Typography variant="subhead-lg" className="lg:font-normal mt-3 lg:mt-5">
            {description}
          </Typography>
          {link
            ?.filter((l) => l.isDisplay)
            .map((l) => {
              return (
                <TransitionLink
                  key={l.label}
                  className={`${l.buttonType === 'Primary' ? 'btn' : 'link'} mt-5`}
                  href={l.href || '#'}
                >
                  {l.label}
                </TransitionLink>
              );
            })}
        </div>
      </div>
    </div>
  );
}
