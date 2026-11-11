const dotColorMaps = {
  yellow: {
    active: '#F0F58E',
    inactive: '#5E5145',
  },
  black: {
    active: '#231711',
    inactive: '#DEEADB',
  },
  orange: {
    active: '#E2600C',
    inactive: '#DEEADB',
  },
  green: {
    active: '#3E7C4F',
    inactive: '#A69B8C',
  },
};
export const carouselConfig = {
  styleObj: (dotColor: keyof typeof dotColorMaps, customStyle?: React.CSSProperties) => {
    const styleObj = {
      '--swiper-pagination-color': dotColorMaps[dotColor].active,
      '--swiper-pagination-bullet-inactive-color': dotColorMaps[dotColor].inactive,
      '--swiper-pagination-bullet-width': '10px',
      '--swiper-pagination-bullet-height': '10px',
      '--swiper-pagination-bullet-horizontal-gap': '2.5px',
      '--swiper-pagination-bullet-inactive-opacity': 1,
      '--swiper-pagination-bottom': '0px',
      ...customStyle,
    };
    return styleObj;
  },
  320: {
    slidesOffsetBefore: 20,
    slidesOffsetAfter: 20,
    slidesPerView: 1.05,
    spaceBetween: 10,
  },
  1024: {
    slidesOffsetBefore: 20,
    slidesOffsetAfter: 20,
    slidesPerView: 6,
    spaceBetween: 10,
  },
};
export const GlobalBackgroundColor = {
  paper: 'bg-surface-paper text-ink-terra',
  terra: 'bg-ink-terra text-surface-sand',
  forest: 'bg-brand-forest text-surface-sand',
  'forest-tint': 'bg-surface-forest-tint text-ink-terra',
  sand: 'bg-surface-sand text-ink-terra',
};
