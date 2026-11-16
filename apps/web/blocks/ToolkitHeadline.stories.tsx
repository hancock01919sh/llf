import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { cmsType } from '@llf/contracts';
import { BlockToolkitHeadline } from './ToolkitHeadline';

// Template story (one per registered block, TDD §6.4).
// Data is shaped after the `component.toolkit-headline` block in apps/web/fixtures/cms/pages.json
// (page "toolkit"), the same shape the component tests use.
const block = {
  __component: 'component.toolkit-headline',
  id: 49,
  description: 'This is the toolkit overview.',
  cta: {
    label: 'download campaign overview',
    href: null as string | null,
    isDisplay: true,
    isButton: true,
    buttonType: null,
    newTab: false,
  },
  file: {
    id: 2,
    documentId: 'uw2g4fsghdx7r63ujtkpj76l',
    url: '/uploads/PDPE_Cert_b124ac2c60.pdf',
    alternativeText: null,
    caption: null,
    width: null,
    height: null,
    mime: 'application/pdf',
    name: 'PDPECert.pdf',
  },
  title: { copy: 'Toolkit headline', header: 'h1' },
} satisfies cmsType.component.ToolkitHeadlineDeepRef;

const meta = {
  title: 'Blocks/ToolkitHeadline',
  component: BlockToolkitHeadline,
  args: { index: 1, pageTitle: 'Toolkit' },
} satisfies Meta<typeof BlockToolkitHeadline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The state the CMS fixture ships: CTA + downloadable file. */
export const Default: Story = { args: { block } };

/** Empty data: no CTA and no file, only the title and description render. */
export const Empty: Story = { args: { block: { ...block, cta: undefined, file: undefined } } };

/** Missing file: the CTA falls back to the "#" placeholder link. */
export const WithoutFile: Story = { args: { block: { ...block, file: undefined } } };

/** Long text: the heading and description must wrap without breaking the layout. */
export const LongText: Story = {
  args: {
    block: {
      ...block,
      title: {
        copy: 'Explore every Long Live Food toolkit resource available right now',
        header: 'h1',
      },
      description:
        'Download campaign assets, classroom posters, and partner handbooks. Every resource is free to use, reviewed by food waste experts, and available in English and Spanish for coalition members across the United States.',
    },
  },
};
