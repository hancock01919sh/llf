import { DynamicZone } from '@/blocks/DynamicZone';
import type { TemplateProps } from './types';
import { Provider } from '@/components/Provider';
import type { FooterCmsDataProps } from '@/components/AppFooter';
import type { GlobalProps } from '@/blocks/types';
// const navigate = await getNavigate();
// const footer = await getFooter();
// const global = await getGlobal();

export function PageTemplate({ page }: TemplateProps) {
  const navigate = {
    title: 'longlivefood',
    searchPlaceholder: 'Search Ingredients Tips',
    link: [
      {
        id: 339,
        Label: 'The Tool',
        href: '/find',
        isDisplay: true,
        isButton: false,
        Buttontype: null,
        NewTab: false,
      },
      {
        id: 340,
        Label: 'Tip Library',
        href: '/explore',
        isDisplay: true,
        isButton: false,
        Buttontype: null,
        NewTab: false,
      },
      {
        id: 341,
        Label: 'GENERAL TIPS',
        href: '/general-tips',
        isDisplay: true,
        isButton: false,
        Buttontype: null,
        NewTab: false,
      },
      {
        id: 342,
        Label: 'About',
        href: '/about',
        isDisplay: true,
        isButton: null,
        Buttontype: 'null',
        NewTab: false,
      },
    ],
  };
  const footer = {
    id: 5,
    documentId: 'r5dugfnte7616vj6x066gyz2',
    legalCopy:
      'This project has been funded wholly or in part by the United States Environmental Protection Agency under assistance agreement 84114701 to World Wildlife Fund, Inc. The contents of this document do not necessarily reflect the views and policies of the Environmental Protection Agency, nor does the Environmental Protection Agency endorse trade names or recommend the use of commercial products mentioned in this document, as well as any images, video, text, or other content created by generative artificial intelligence tools, nor does any such content necessarily reflect the views and policies of the Environmental Protection Agency.',
    createdAt: '2026-10-23T02:37:47.094Z',
    updatedAt: '2026-10-27T05:34:38.283Z',
    publishedAt: '2026-10-27T05:34:38.339Z',
    title: 'longlivefood',
    link: [
      {
        id: 330,
        Label: 'The Tool',
        href: '/find',
        isDisplay: true,
        isButton: null,
        Buttontype: null,
        NewTab: false,
      },
      {
        id: 331,
        Label: 'Tip Library',
        href: '/explore',
        isDisplay: true,
        isButton: null,
        Buttontype: null,
        NewTab: false,
      },
      {
        id: 332,
        Label: 'Toolkit',
        href: null,
        isDisplay: true,
        isButton: null,
        Buttontype: null,
        NewTab: false,
      },
      {
        id: 333,
        Label: 'GENERAL TIPS',
        href: '/general-tips',
        isDisplay: true,
        isButton: null,
        Buttontype: null,
        NewTab: false,
      },
      {
        id: 334,
        Label: 'About',
        href: '/about',
        isDisplay: true,
        isButton: null,
        Buttontype: null,
        NewTab: false,
      },
    ],
    overlayLink: [
      {
        id: 28,
        Label: 'Terms of Use',
        Overlay_description: null,
        href: null,
      },
      {
        id: 29,
        Label: 'Privacy Policy',
        Overlay_description: null,
        href: null,
      },
      {
        id: 30,
        Label: 'Manage Preferences',
        Overlay_description: null,
        href: null,
      },
    ],
    iconLink: [
      {
        id: 25,
        Label: 'Instagram',
        href: 'https://www.instagram.com/',
        Image: {
          id: 69,
          documentId: 'xs54jjoinuzbs25dnecqzrq0',
          name: 'inst.png',
          alternativeText: 'instagram',
          caption: null,
          focalPoint: null,
          width: 113,
          height: 113,
          formats: null,
          hash: 'inst_d00e0485a9',
          ext: '.png',
          mime: 'image/png',
          size: 1.16,
          url: '/uploads/inst_d00e0485a9.png',
          previewUrl: null,
          provider: 'local',
          provider_metadata: null,
          createdAt: '2026-10-15T05:42:37.033Z',
          updatedAt: '2026-10-16T05:51:28.023Z',
          publishedAt: '2026-10-15T05:42:37.033Z',
        },
      },
      {
        id: 26,
        Label: 'Tiktok',
        href: 'https://www.tiktok.com/',
        Image: {
          id: 67,
          documentId: 'uv03hwnobgmkmfflb4mgecqb',
          name: 'tiktok.png',
          alternativeText: 'tiktok',
          caption: null,
          focalPoint: null,
          width: 113,
          height: 113,
          formats: null,
          hash: 'tiktok_fb9de2341f',
          ext: '.png',
          mime: 'image/png',
          size: 0.81,
          url: '/uploads/tiktok_fb9de2341f.png',
          previewUrl: null,
          provider: 'local',
          provider_metadata: null,
          createdAt: '2026-10-15T05:43:01.181Z',
          updatedAt: '2026-10-16T05:51:13.105Z',
          publishedAt: '2026-10-15T05:43:01.181Z',
        },
      },
      {
        id: 27,
        Label: 'Youtube',
        href: 'https://www.youtube.com/',
        Image: {
          id: 68,
          documentId: 'ttvgzci77nny3z3tj1awh9p1',
          name: 'youtube.png',
          alternativeText: 'youtube',
          caption: null,
          focalPoint: null,
          width: 113,
          height: 113,
          formats: null,
          hash: 'youtube_ba11a6d292',
          ext: '.png',
          mime: 'image/png',
          size: 0.8,
          url: '/uploads/youtube_ba11a6d292.png',
          previewUrl: null,
          provider: 'local',
          provider_metadata: null,
          createdAt: '2026-10-15T05:43:01.177Z',
          updatedAt: '2026-10-16T05:51:18.634Z',
          publishedAt: '2026-10-15T05:43:01.177Z',
        },
      },
    ],
  };
  const global = {
    id: 5,
    documentId: 'l20oqa08azr635xlm0g577ht',
    title: 'longlivefood',
    seo: null,
    load: {
      id: 11,
      Title: 'Finding ways to waste less of the food you love.',
      Statement: 'Extracting ingredients...',
    },
  };

  return (
    <>
      <Provider
        navigation={navigate}
        footer={footer as FooterCmsDataProps}
        global={global as GlobalProps}
      >
        <DynamicZone page={page} />
      </Provider>
    </>
  );
}
