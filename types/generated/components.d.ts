import type { Schema, Struct } from '@strapi/strapi';

export interface ComponentCarousel extends Struct.ComponentSchema {
  collectionName: 'components_component_carousels';
  info: {
    displayName: 'Carousel';
    icon: 'stack';
  };
  attributes: {
    categories: Schema.Attribute.Relation<
      'oneToMany',
      'api::category.category'
    >;
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    description: Schema.Attribute.Text;
    layout: Schema.Attribute.Enumeration<['Basic', 'Compact']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Basic'>;
    mode: Schema.Attribute.Enumeration<['categories']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'categories'>;
    title: Schema.Attribute.Component<'shared.title', false>;
  };
}

export interface ComponentHero extends Struct.ComponentSchema {
  collectionName: 'components_component_heroes';
  info: {
    displayName: 'Hero';
    icon: 'crown';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    description: Schema.Attribute.Blocks;
    eyebrow: Schema.Attribute.String;
    images: Schema.Attribute.Media<'images' | 'files', true>;
    layout: Schema.Attribute.Enumeration<['Primary', 'Secondary']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Primary'>;
  };
}

export interface ComponentLinkList extends Struct.ComponentSchema {
  collectionName: 'components_component_link_lists';
  info: {
    displayName: 'Link List';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Blocks;
    layout: Schema.Attribute.Enumeration<['Basic', 'Two Column']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Basic'>;
    pages: Schema.Attribute.Relation<'oneToMany', 'api::page.page'>;
    title: Schema.Attribute.Component<'shared.title', false>;
  };
}

export interface ComponentTeaser extends Struct.ComponentSchema {
  collectionName: 'components_component_teasers';
  info: {
    displayName: 'Teaser';
    icon: 'briefcase';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    description: Schema.Attribute.Blocks;
    images: Schema.Attribute.Media<'images' | 'files', true>;
    layout: Schema.Attribute.Enumeration<['Basic', 'Highlight', 'Quote']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Basic'>;
    title: Schema.Attribute.Component<'shared.title', false>;
  };
}

export interface CustomSearch extends Struct.ComponentSchema {
  collectionName: 'components_custom_searches';
  info: {
    displayName: 'Search';
    icon: 'search';
  };
  attributes: {
    placeholder: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Search 100+ ingredients'>;
  };
}

export interface CustomTipList extends Struct.ComponentSchema {
  collectionName: 'components_custom_tip_lists';
  info: {
    displayName: 'Tip List';
    icon: 'collapse';
  };
  attributes: {
    description: Schema.Attribute.Text;
    layout: Schema.Attribute.Enumeration<['Basic', 'Single']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Basic'>;
    tips: Schema.Attribute.Relation<'oneToMany', 'api::tip.tip'>;
    title: Schema.Attribute.Component<'shared.title', false>;
  };
}

export interface CustomTool extends Struct.ComponentSchema {
  collectionName: 'components_custom_tools';
  info: {
    displayName: 'Tool';
    icon: 'command';
  };
  attributes: {
    cta_label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Find my tips'>;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Explainer copy guiding user on how to upload a recipe to the tool and mentioning several popular sites the tool works with.'>;
    upload_label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Image Upload'>;
    upload_placeholder: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Upload Image'>;
    url_label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Recipe URL'>;
    url_placeholder: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Enter URL'>;
  };
}

export interface SharedCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_ctas';
  info: {
    displayName: 'cta';
  };
  attributes: {
    href: Schema.Attribute.String;
    label: Schema.Attribute.String;
    page: Schema.Attribute.Relation<'oneToOne', 'api::page.page'>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'code';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaKeywords: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String;
  };
}

export interface SharedTitle extends Struct.ComponentSchema {
  collectionName: 'components_shared_titles';
  info: {
    displayName: 'title';
  };
  attributes: {
    copy: Schema.Attribute.String;
    header: Schema.Attribute.Enumeration<['h1', 'h2', 'h3', 'h4', 'h5', 'h6']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'h3'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'component.carousel': ComponentCarousel;
      'component.hero': ComponentHero;
      'component.link-list': ComponentLinkList;
      'component.teaser': ComponentTeaser;
      'custom.search': CustomSearch;
      'custom.tip-list': CustomTipList;
      'custom.tool': CustomTool;
      'shared.cta': SharedCta;
      'shared.seo': SharedSeo;
      'shared.title': SharedTitle;
    }
  }
}
