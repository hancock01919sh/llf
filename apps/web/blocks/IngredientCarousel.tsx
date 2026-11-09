'use client';
import { carouselConfig } from '@/lib/const';
import { Typography } from '@/components/Typography';
import { IconCarouselNavigation } from '@/components/Icon';
import { EasyImage } from '@/components/UIImage';
import { useRef, useState, useEffect } from 'react';
import { Pagination, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { BlockTitle } from '@/components/BlockTitle';

export function BlockIngredientCarousel(
  props: BlockProps<cmsType.component.IngredientCarouselDeepRef>,
) {
  const { ingredientCard, title, description } = props.block;
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
        {/* <Typography variant="headline-lg">{title}</Typography> */}
        <BlockTitle title={title!} moduleIndex={props.index} />
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
              slidesPerView: 4.3,
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
          {ingredientCard.map((item, index) => (
            <SwiperSlide
              key={item.title + index}
              className="rounded-md overflow-hidden flex flex-col border border-ink-terra "
            >
              <EasyImage
                url={item?.image?.url || ''}
                alt={item.image?.alternativeText || item.title || ''}
                className="w-full aspect-298/270 lg:aspect-298/266"
              />
              <Typography
                variant="headline-sm"
                className={`uppercase text-ink-terra p-8 text-center`}
              >
                {item.title}
              </Typography>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <div className="flex-center justify-between mt-10 lg:mt-15">
        <IconCarouselNavigation
          ref={prevRef}
          point={'left'}
          className="hidden lg:block cursor-pointer"
        ></IconCarouselNavigation>
        <div
          style={{
            ...carouselConfig.styleObj('green'),
          }}
          className=" flex justify-center gap-1"
          ref={paginationRef}
        ></div>
        <IconCarouselNavigation
          ref={nextRef}
          point={'right'}
          className="hidden lg:block cursor-pointer"
        ></IconCarouselNavigation>
      </div>
    </div>
  );
}
