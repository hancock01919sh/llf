'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Typography } from '@/components//Typography';
import { EffectCards, Navigation, Pagination } from 'swiper/modules';
import TransitionLink from '@/components/TransitionLink';
import { carouselConfig } from '@/lib/const';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';
import { IconArrow } from '@/components/Icon';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { BlockTitle } from '@/components/BlockTitle';
import { UIImage } from '@/components/UIImage';
export function CategoryCarouselFeature(
  props: BlockProps<cmsType.component.CategoryCarouselFeatureDeepRef>,
) {
  const { title, description, link, featureCard } = props.block;
  return (
    <div className="py-15 lg:py-25">
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-15">
        <BlockTitle
          title={title!}
          moduleIndex={props.index}
          className="text-center mx-5 lg:mx-0 lg:text-left lg:1/2"
        />
        <div className="flex flex-col gap-5">
          <Typography variant="subhead-lg" className="text-center mx-5  lg:text-left lg:mx-0">
            {description}
          </Typography>
          <LinkWrapper className="hidden lg:flex gap-5" Link={link} />
        </div>
      </div>
      <div className="relative lg:w-150 lg:mx-auto">
        <div className=" lg:hidden ">
          <Swiper
            className="mt-lg pb-10! lg:hidden leading-1"
            modules={[Pagination]}
            pagination={true}
            style={{
              ...carouselConfig.styleObj('yellow'),
            }}
            {...carouselConfig[320]}
          >
            {featureCard
              .filter((item) => !!item.category)
              .map((item, index) => (
                <SwiperSlide
                  key={index}
                  className="flex flex-col bg-surface-paper overflow-hidden rounded-md h-auto! "
                >
                  <TransitionLink
                    className="flex flex-col h-full"
                    href={`/tips/${item.category?.slug}`}
                  >
                    <UIImage
                      src={item.category?.image?.url || ''}
                      alt={
                        item.category?.image?.alternativeText ||
                        item.category?.image?.name ||
                        item.category?.title ||
                        ''
                      }
                      className="aspect-362/276 object-cover lg:aspect-535/438 lg:w-full"
                    />
                    <Typography
                      variant="headline-sm"
                      className="flex-1 line-clamp-2 text-center m-8 text-ink-terra uppercase leading-none"
                    >
                      {item.category?.title || ''}
                    </Typography>
                  </TransitionLink>
                </SwiperSlide>
              ))}
          </Swiper>
        </div>

        <div className="hidden lg:block ">
          <Swiper
            className="mt-lg pb-14! lg:mt-26 lg:w-full overflow-hidden "
            modules={[EffectCards, Navigation, Pagination]}
            navigation={{
              enabled: true,
              prevEl: '.custom-arrow-prev',
              nextEl: '.custom-arrow-next',
            }}
            pagination={{
              clickable: true,
            }}
            style={{
              ...carouselConfig.styleObj('yellow', {
                '--swiper-pagination-bottom': '0px',
              } as React.CSSProperties),
            }}
            slidesPerView={1}
            effect="cards"
            cardsEffect={{
              perSlideOffset: 35,
              slideShadows: true,
              perSlideRotate: 0,
            }}
            keyboard={true}
          >
            {featureCard
              .filter((item) => !!item.category)
              .map((item, index) => (
                <SwiperSlide
                  key={item.category?.id + '' + item.category?.documentId + '' + index}
                  className="h-auto! bg-surface-paper overflow-hidden rounded-md "
                >
                  <TransitionLink
                    className="flex flex-col h-full"
                    href={`/tips/${item.category?.slug}`}
                  >
                    <UIImage
                      src={item.category?.image?.url || ''}
                      alt={
                        item.category?.image?.alternativeText ||
                        item.category?.image?.name ||
                        item.category?.title ||
                        ''
                      }
                      className="aspect-362/296 object-cover lg:aspect-535/438 lg:w-full"
                    />
                    <Typography
                      variant="headline-sm"
                      className=" flex-1 line-clamp-2 m-8 text-center text-ink-terra uppercase leading-none"
                    >
                      {item.category?.title || ''}
                    </Typography>
                  </TransitionLink>
                </SwiperSlide>
              ))}
          </Swiper>
        </div>

        {[
          {
            point: 'left',
            className: 'custom-arrow-prev left-0',
          },
          {
            point: 'right',
            className: 'custom-arrow-next right-0',
          },
        ].map((item) => {
          return (
            <button
              key={item.point}
              aria-label={item.point === 'left' ? 'prev' : 'next'}
              className={`${item.className} ${item.point === 'left' ? ' -translate-x-1/2' : ' translate-x-1/2'} disabled:opacity-70 hidden lg:flex cursor-pointer absolute z-2 top-1/2 -translate-y-1/2  bg-surface-mint-dark w-11 h-11 rounded-full justify-center items-center`}
            >
              <IconArrow point={item.point as 'left' | 'right'} />
            </button>
          );
        })}
      </div>
      <LinkWrapper className="mt-lg lg:hidden" Link={link} />
    </div>
  );
}
function LinkWrapper({
  className = '',
  Link = [],
}: {
  className: string;
  Link: cmsType.shared.Links[];
}) {
  return (
    <div className={className}>
      {Link.filter((item) => item.buttonType === 'Primary').map((item) => {
        return (
          <TransitionLink
            key={item.label}
            className={`btn mx-5 lg:mx-0`}
            href={item.href || '/find'}
          >
            {item.label}
          </TransitionLink>
        );
      })}
    </div>
  );
}
