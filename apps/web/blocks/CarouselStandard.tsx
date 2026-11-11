'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { Typography } from '@/components/Typography';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { carouselConfig } from '@/lib/const';
import { useEffect, useRef, useState } from 'react';
import { IconCarouselNavigation } from '@/components/Icon';
import { UIImage } from '@/components/UIImage';
import type { BlockProps } from './types';
import type { cmsType } from '@llf/contracts';
import { BlockTitle } from '@/components/BlockTitle';
import TransitionLink from '@/components/TransitionLink';
const cardColoMapping = {
  paper: 'bg-surface-sand',
  sand: 'bg-surface-paper',
  terra: 'bg-surface-sand',
  'Bright Yellow': 'bg-surface-mint',
};
export function BlockCarouselStandard(
  props: BlockProps<cmsType.component.CarouselStandardDeepRef>,
) {
  const { title, description, backgroundColor, standardCard, cardBackgroundColor } = props.block;
  const paginationRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [showSwiper, setShowSwiper] = useState(false);
  useEffect(() => {
    if (paginationRef.current && prevRef.current && nextRef.current) {
      setShowSwiper(true);
    }
  }, []);
  return (
    <div className="py-15 lg:py-25">
      <div className="px-gutter text-center">
        <BlockTitle title={title} moduleIndex={props.index} />
        <Typography variant="subhead-lg" className="mt-5">
          {description}
        </Typography>
      </div>

      {showSwiper && (
        <Swiper
          slidesPerView={1.01}
          modules={[Pagination, Navigation]}
          spaceBetween={10}
          slidesOffsetBefore={20}
          slidesOffsetAfter={20}
          pagination={{
            clickable: true,
            el: paginationRef.current,
          }}
          className="mt-10 lg:mt-15"

          breakpoints={{
            1024: {
              slidesPerView: 2.35,
              spaceBetween: 20,
              slidesOffsetBefore: 0,
              slidesOffsetAfter: 0,
              navigation: {
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              },
            },
          }}
        >
          {standardCard
            .filter((item) => !!item.category)
            .map((item, index) => (
              <SwiperSlide
                key={item.category?.id + '' + item.category?.documentId + '' + index}
                className="rounded-md overflow-hidden flex flex-col "
              >
                <TransitionLink href={`/tips/${item.category?.slug}`}>
                  <UIImage
                    src={item.category?.image?.url || ''}
                    alt={
                      item.category?.image?.alternativeText ||
                      item.category?.image?.name ||
                      item.category?.title ||
                      ''
                    }
                    className="w-full aspect-362/304 lg:aspect-535/438"
                  />

                  <Typography
                    variant="headline-sm"
                    className={`uppercase ${cardColoMapping[cardBackgroundColor ?? backgroundColor]} text-ink-terra p-8 text-center lg:py-10`}
                  >
                    {item.category?.title || ''}
                  </Typography>
                </TransitionLink>
              </SwiperSlide>
            ))}
        </Swiper>
      )}

      <div className="flex-center justify-between mt-10 lg:mt-15">
        <IconCarouselNavigation
          ref={prevRef}
          point={'left'}
          color={backgroundColor === 'terra' ? 'paper' : undefined}
          className="hidden lg:block cursor-pointer"
        ></IconCarouselNavigation>
        <div
          style={{
            ...carouselConfig.styleObj(backgroundColor === 'terra' ? 'yellow' : 'green'),
          }}
          className=" flex justify-center gap-1"
          ref={paginationRef}
        ></div>
        <IconCarouselNavigation
          ref={nextRef}
          point={'right'}
          className="hidden lg:block cursor-pointer"
          color={backgroundColor === 'terra' ? 'paper' : undefined}
        ></IconCarouselNavigation>
      </div>
    </div>
  );
}
