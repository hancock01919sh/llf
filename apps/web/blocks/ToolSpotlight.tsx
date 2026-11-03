'use client';

import { Typography } from '@/components/Typography';
import { UIVideo } from '@/components/UIVideo';
import { useRef, useState } from 'react';

import TransitionLink from '@/components/TransitionLink';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { carouselConfig } from '@/lib/const';
import type { BlockProps } from './types';
import type { cmsType } from '@llf/contracts';
export function ToolSpotlight(props: BlockProps<cmsType.component.ToolSpotlight>) {
  const { SubTitle, Link, SpotlightItem, Title } = props.block;
  const [swiperIndex, setSwiperIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!containerRef.current || window.innerWidth < 1024) return;
    const texts = gsap.utils.toArray<HTMLParagraphElement>(
      containerRef.current.querySelectorAll('.text-wrapper>p'),
    );
    const videos = gsap.utils.toArray<HTMLVideoElement>(
      containerRef.current.querySelectorAll('.video-wrapper>.video-item'),
    );

    gsap.set(videos, {
      yPercent: 120, // 初始位于屏幕底部
      scale: 1,
      autoAlpha: 1,
      zIndex: (i) => i + 1,
    });

    gsap.set(texts, {
      color: '#1A4F3A',
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'bottom bottom',
        end: () => `+=${window.innerHeight}`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    const count = SpotlightItem.length;
    if (videos.length !== count) return;
    for (let i = 0; i < count; i++) {
      const start = i;

      // 新视频从屏幕底部上移，覆盖上一张
      tl.to(
        videos[i]!,
        {
          yPercent: i === count - 1 ? -12 : 0,
          duration: 1,
          ease: 'none',
        },
        start,
      );

      // 上一个视频缩小并半透明
      if (videos[i - 1]) {
        tl.to(
          videos[i - 1]!,
          {
            yPercent: -20,
            scale: 0.824,
            autoAlpha: 0.5,
            duration: 1,
            ease: 'none',
          },
          start,
        );
      }

      // 再往上一层的视频彻底消失
      if (videos[i - 2] !== undefined) {
        if (i >= 2) {
          tl.to(
            videos[i - 2]!,
            {
              autoAlpha: 0,
              duration: 0.1,
              ease: 'none',
            },
            start + 0.5,
          );
        }
      }

      // 文字同步切换颜色
      tl.to(
        texts[i]!,
        {
          color: '#fbf5ce',
          duration: 1,
          ease: 'none',
        },
        start,
      );

      if (texts[i - 1]) {
        tl.to(
          texts[i - 1]!,
          {
            color: '#1A4F3A',
            duration: 1,
            ease: 'none',
          },
          start,
        );
      }
    }
  }, [containerRef]);
  return (
    <div
      ref={containerRef}
      className="py-15 lg:py-25 flex flex-col gap-lg max-w-page mx-auto lg:px-gutter-lg"
    >
      <div className="px-4.5 lg:px-0 lg:w-[70%] lg:mx-auto ">
        <Typography variant="headline-lg" className="text-center">
          {Title}
        </Typography>
        <Typography variant="subhead-lg" className="font-bold mt-5 lg:hidden">
          {SubTitle}
        </Typography>
        <Typography
          variant="subhead-lg"
          className="hidden mt-5 font-normal lg:block lg:text-center"
        >
          {SubTitle}
        </Typography>
      </div>
      <div className="w-full aspect-402/468 lg:hidden">
        <Swiper
          className="w-full h-full pb-5! leading-1"
          onSlideChange={(_swiper) => {
            setSwiperIndex(_swiper.activeIndex);
          }}
          modules={[Pagination]}
          pagination={true}
          style={{
            ...carouselConfig.styleObj('yellow'),
          }}
          {...carouselConfig[320]}
          slidesPerView={1}
        >
          {SpotlightItem.map((item, index) => (
            <SwiperSlide key={item.Copy} className="overflow-hidden">
              <UIVideo
                src={item?.Video?.url ?? ''}
                className=" aspect-square rounded-md"
                pause={swiperIndex !== index}
                loop={true}
                lazyLoad={true}
              />
              <Typography
                variant="title-card"
                className=" text-center mt-5 w-4/5 mx-auto leading-none"
              >
                {item.Copy}
              </Typography>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="hidden w-full lg:flex lg:mt-35 max-w-page mx-auto">
        <div className="video-wrapper relative w-1/2">
          {SpotlightItem.map((item, index) => (
            <UIVideo
              key={item?.Video?.documentId ?? index}
              src={item?.Video?.url ?? ''}
              className="video-item w-[65%] mx-auto absolute! top-0 left-1/2 -translate-x-1/2 aspect-426/532 rounded-md"
              loop={true}
              muted={true}
            />
          ))}
        </div>
        <div className="w-1/2">
          <div className="text-wrapper flex flex-col gap-6">
            {SpotlightItem.map((item) => (
              <Typography
                key={item.Copy}
                variant="headline-md"
                className={`uppercase text-[#1A4F3A]}`}
              >
                {item.Copy}
              </Typography>
            ))}
          </div>

          <div className="w-max mt-6">
            <TransitionLink className="btn " href={Link?.href ?? '#'}>
              {Link?.Label ?? ''}
            </TransitionLink>
          </div>
        </div>
      </div>

      <div className="px-4.5 w-full lg:hidden">
        <TransitionLink className="btn " href={Link?.href ?? '#'}>
          {Link?.Label ?? ''}
        </TransitionLink>
      </div>
    </div>
  );
}

