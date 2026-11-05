'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Typography } from '@/components//Typography';
import Image from 'next/image';
import { EffectCards, Navigation, Pagination } from 'swiper/modules';
import TransitionLink from '@/components/TransitionLink';
import { carouselConfig } from '@/lib/const';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';
import { IconArrow } from '@/components/Icon';
import { Fragment } from 'react';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
export function CategoryCarouselFeature(
  props: BlockProps<cmsType.component.CategoryCarouselFeatureDeepRef>,
) {
  const { title, description, link, featureCard } = props.block;
  return (
    <div className="py-15 lg:py-25 max-w-page mx-auto lg:px-gutter-lg">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:gap-5">
        <Typography
          variant="headline-lg"
          className="text-center mx-5 lg:mx-0 lg:text-left"
          richText={true}
        >
          {title}
        </Typography>
        <div className="lg:w-1/2 flex flex-col gap-5">
          <Typography
            variant="subhead-lg"
            className="text-center mx-5 mt-5 lg:text-left lg:mx-0 lg:mt-0"
          >
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
            {featureCard.map((item, index) => (
              <SwiperSlide
                key={index}
                className="flex flex-col bg-surface-paper overflow-hidden rounded-md aspect-362/420 lg:aspect-auto"
              >
                <Image
                  src={item.image?.url || ''}
                  alt={item.image?.alternativeText || ''}
                  width={362}
                  height={296}
                  className="aspect-362/296 object-cover lg:aspect-535/438 lg:w-full"
                />
                <Typography
                  variant="headline-sm"
                  className="text-center p-9 pt-6.5 text-ink-terra uppercase leading-none"
                >
                  {item.title}
                </Typography>
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
            {featureCard.map((item, index) => (
              <SwiperSlide
                key={index}
                className="flex flex-col bg-surface-paper overflow-hidden rounded-md lg:aspect-535/583"
              >
                <Image
                  src={item.image?.url || ''}
                  alt={item.image?.alternativeText || ''}
                  width={362}
                  height={296}
                  className="aspect-362/296 object-cover lg:aspect-535/438 lg:w-full"
                />
                <Typography
                  variant="headline-sm"
                  className="text-center p-9 pt-6.5 text-ink-terra uppercase leading-none"
                >
                  {item.title}
                </Typography>
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
            <div
              key={item.point}
              className={`${item.className} hidden lg:flex cursor-pointer absolute z-2 top-1/2 -translate-y-1/2 bg-surface-mint-dark w-11 h-11 rounded-full justify-center items-center`}
            >
              <IconArrow point={item.point as 'left' | 'right'} />
            </div>
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
      {Link.map((item) => {
        if (item.buttonType === 'Primary') {
          return (
            <TransitionLink
              key={item.label}
              className={`btn mx-5 lg:mx-0`}
              href={item.href || '/find'}
            >
              {item.label}
            </TransitionLink>
          );
        }
        return (
          <Fragment key={item.label}>
            <TransitionLink
              className="link mx-auto block mt-5 lg:mx-0 lg:hidden"
              href={item.href || '/search'}
            >
              {item.label}
            </TransitionLink>
            <TransitionLink
              className="btn black hidden mx-auto lg:block lg:mx-0 lg:px-lg "
              href={'/search'}
            >
              {item.label}
            </TransitionLink>
          </Fragment>
        );
      })}
    </div>
  );
}
