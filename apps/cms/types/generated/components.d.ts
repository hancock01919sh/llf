import type { Schema, Struct } from "@strapi/strapi";

export interface Component404 extends Struct.ComponentSchema {
  collectionName: "components_component_404s";
  info: {
    displayName: "404";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["forest"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface Component5050TextAndImage extends Struct.ComponentSchema {
  collectionName: "components_component_5050_text_and_images";
  info: {
    displayName: "5050 Text & Image";
  };
  attributes: {
    addBackgroundColor: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    backgroundColor: Schema.Attribute.Enumeration<["paper", "forest"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios"> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    makeImageLeft: Schema.Attribute.Boolean;
    positionOfAddingBgColor: Schema.Attribute.Enumeration<["Up ", "Down"]>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentAccordion extends Struct.ComponentSchema {
  collectionName: "components_component_accordions";
  info: {
    displayName: "Accordion";
  };
  attributes: {
    accordionItem: Schema.Attribute.Component<"shared.accordion-item", true> &
      Schema.Attribute.Required;
    backgroundColor: Schema.Attribute.Enumeration<["forest-tint"]> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    subTitle: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentCarousel extends Struct.ComponentSchema {
  collectionName: "components_component_carousels";
  info: {
    displayName: "Carousel";
    icon: "stack";
  };
  attributes: {
    categories: Schema.Attribute.Relation<
      "manyToMany",
      "api::category.category"
    >;
    ctas: Schema.Attribute.Component<"shared.cta", true>;
    description: Schema.Attribute.Text;
    layout: Schema.Attribute.Enumeration<["Basic", "Compact"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Basic">;
    mode: Schema.Attribute.Enumeration<["categories"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"categories">;
    title: Schema.Attribute.Component<"shared.title", false>;
  };
}

export interface ComponentCarouselSmall extends Struct.ComponentSchema {
  collectionName: "components_component_carousel_smalls";
  info: {
    displayName: "Carousel - Small";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["paper"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    smallCard: Schema.Attribute.Component<"shared.small-card", true> &
      Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentCarouselStandard extends Struct.ComponentSchema {
  collectionName: "components_component_carousel_standards";
  info: {
    displayName: "Carousel - Standard";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["sand", "paper", "terra"]> &
      Schema.Attribute.Required;
    cardBackgroundColor: Schema.Attribute.Enumeration<["Bright Yellow"]>;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    standardCard: Schema.Attribute.Component<"shared.standard-card", true> &
      Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentCategoryCarouselFeature
  extends Struct.ComponentSchema {
  collectionName: "components_component_category_carousel_features";
  info: {
    displayName: "Category Carousel - Feature";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["terra"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"terra">;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    featureCard: Schema.Attribute.Component<"shared.feature-card", true> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    link: Schema.Attribute.Component<"shared.links", true> &
      Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentCategoryDetail extends Struct.ComponentSchema {
  collectionName: "components_component_category_details";
  info: {
    displayName: "Category Detail";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["forest"]> &
      Schema.Attribute.Required;
    button: Schema.Attribute.Component<"shared.links", false>;
    description: Schema.Attribute.Text;
    hint: Schema.Attribute.Text;
    image: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios",
      true
    >;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    popup: Schema.Attribute.Component<"component.tips-popup", false>;
    statement: Schema.Attribute.Blocks;
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.Component<"shared.title", false>;
  };
}

export interface ComponentCategoryEmoji extends Struct.ComponentSchema {
  collectionName: "components_component_category_emojis";
  info: {
    displayName: "Category - Emoji";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["paper"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.Component<"shared.emoji-item", true> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentContentSpotlight extends Struct.ComponentSchema {
  collectionName: "components_component_content_spotlights";
  info: {
    displayName: "Content Spotlight";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["paper", "sand"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios"> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    makeImageLeft: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentGuide extends Struct.ComponentSchema {
  collectionName: "components_component_guides";
  info: {
    displayName: "Guide";
  };
  attributes: {
    assets: Schema.Attribute.Component<"shared.assets-cards", true> &
      Schema.Attribute.Required;
    backgroundColor: Schema.Attribute.Enumeration<["paper"]>;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentHeader extends Struct.ComponentSchema {
  collectionName: "components_component_headers";
  info: {
    displayName: "Header";
  };
  attributes: {
    addBackgroundColor: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    backgroundColor: Schema.Attribute.Enumeration<["terra", "forest"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    positionOfAddingBgColor: Schema.Attribute.Enumeration<["up", "down"]>;
    subTitle: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentHero extends Struct.ComponentSchema {
  collectionName: "components_component_heroes";
  info: {
    displayName: "Hero";
    icon: "crown";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["terra"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    images: Schema.Attribute.Media<"images" | "files" | "videos", true> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    link: Schema.Attribute.Component<"shared.links", true>;
    title: Schema.Attribute.Blocks & Schema.Attribute.Required;
  };
}

export interface ComponentHighlightComponent extends Struct.ComponentSchema {
  collectionName: "components_component_highlight_components";
  info: {
    displayName: "Highlight Component";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<
      ["forest-tint", "paper", "forest"]
    > &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    desktopImage: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios"
    > &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    link: Schema.Attribute.Component<"shared.links", true>;
    mobileImage: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios"
    >;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentIngredientCarousel extends Struct.ComponentSchema {
  collectionName: "components_component_ingredient_carousel_s";
  info: {
    displayName: "Ingredient Carousel ";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["paper"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    ingredientCard: Schema.Attribute.Component<"shared.ingredient-card", true> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentLinkList extends Struct.ComponentSchema {
  collectionName: "components_component_link_lists";
  info: {
    displayName: "Link List";
    icon: "bulletList";
  };
  attributes: {
    description: Schema.Attribute.Blocks;
    layout: Schema.Attribute.Enumeration<["Basic", "Two Column"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Basic">;
    pages: Schema.Attribute.Relation<"manyToMany", "api::page.page">;
    title: Schema.Attribute.Component<"shared.title", false>;
  };
}

export interface ComponentLoading extends Struct.ComponentSchema {
  collectionName: "components_component_loadings";
  info: {
    displayName: "Loading";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["forest"]> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    statement: Schema.Attribute.Text;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentLogoCards extends Struct.ComponentSchema {
  collectionName: "components_component_logo_cards";
  info: {
    displayName: "Logo Cards";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["paper", "forest"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    imageDesktop: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios",
      true
    >;
    imageMobile: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios",
      true
    >;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentSearch extends Struct.ComponentSchema {
  collectionName: "components_component_searches";
  info: {
    displayName: "Search";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["paper"]>;
    button: Schema.Attribute.Component<"shared.links", false>;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    hint: Schema.Attribute.Text & Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    placeholder: Schema.Attribute.String & Schema.Attribute.Required;
    popup: Schema.Attribute.Component<"component.tips-popup", false>;
    statement: Schema.Attribute.Blocks & Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentTeaser extends Struct.ComponentSchema {
  collectionName: "components_component_teasers";
  info: {
    displayName: "Teaser";
    icon: "briefcase";
  };
  attributes: {
    ctas: Schema.Attribute.Component<"shared.cta", true>;
    description: Schema.Attribute.Blocks;
    images: Schema.Attribute.Media<"images" | "files", true>;
    layout: Schema.Attribute.Enumeration<["Basic", "Highlight", "Quote"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Basic">;
    title: Schema.Attribute.Component<"shared.title", false>;
  };
}

export interface ComponentTextAndImageCard extends Struct.ComponentSchema {
  collectionName: "components_component_text_and_image_cards";
  info: {
    displayName: "Text and Image Card";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["paper"]> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios",
      true
    > &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentTipBanner extends Struct.ComponentSchema {
  collectionName: "components_component_tip_banners";
  info: {
    displayName: "Tip Banner";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["terra", "forest"]> &
      Schema.Attribute.Required;
    cta: Schema.Attribute.Component<"shared.links", true>;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    tip: Schema.Attribute.Relation<"oneToOne", "api::tip.tip">;
  };
}

export interface ComponentTipsPopup extends Struct.ComponentSchema {
  collectionName: "components_component_tips_popups";
  info: {
    displayName: "Tips Popup";
  };
  attributes: {
    description: Schema.Attribute.Text;
    link: Schema.Attribute.Component<"shared.links", false>;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentToolInput extends Struct.ComponentSchema {
  collectionName: "components_component_tool_inputs";
  info: {
    displayName: "Tool Input";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["forest", "paper"]> &
      Schema.Attribute.Required;
    button: Schema.Attribute.Component<"shared.links", true>;
    cardDescription: Schema.Attribute.Text;
    cards: Schema.Attribute.Component<"shared.input-card", true>;
    cardTitle: Schema.Attribute.String & Schema.Attribute.Required;
    copy: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    placeholder: Schema.Attribute.String;
    subTitle: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentToolSpotlight extends Struct.ComponentSchema {
  collectionName: "components_component_tool_spotlights";
  info: {
    displayName: "Tool Spotlight";
  };
  attributes: {
    backgroundColor: Schema.Attribute.Enumeration<["forest"]> &
      Schema.Attribute.Required;
    isFullwidth: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    link: Schema.Attribute.Component<"shared.links", false>;
    spotlightItem: Schema.Attribute.Component<"shared.spotlight-item", true> &
      Schema.Attribute.Required;
    subTitle: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface ComponentToolkit extends Struct.ComponentSchema {
  collectionName: "components_component_toolkits";
  info: {
    displayName: "Toolkit";
  };
  attributes: {
    title: Schema.Attribute.String & Schema.Attribute.Required;
    toolkitCategory: Schema.Attribute.Component<
      "component.toolkit-parent-category",
      true
    > &
      Schema.Attribute.Required;
  };
}

export interface ComponentToolkitHeadline extends Struct.ComponentSchema {
  collectionName: "components_component_toolkit_headlines";
  info: {
    displayName: "Toolkit Info";
  };
  attributes: {
    cta: Schema.Attribute.Component<"shared.links", false>;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    file: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    title: Schema.Attribute.Component<"shared.title", false>;
  };
}

export interface ComponentToolkitParentCategory extends Struct.ComponentSchema {
  collectionName: "components_component_toolkit_parent_categories";
  info: {
    displayName: "Toolkit ParentCategory";
  };
  attributes: {
    subCategory: Schema.Attribute.Component<"component.guide", true> &
      Schema.Attribute.Required;
    title: Schema.Attribute.Component<"shared.title", false> &
      Schema.Attribute.Required;
  };
}

export interface CustomSearch extends Struct.ComponentSchema {
  collectionName: "components_custom_searches";
  info: {
    displayName: "Search";
    icon: "search";
  };
  attributes: {
    placeholder: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Search 100+ ingredients">;
  };
}

export interface CustomTipList extends Struct.ComponentSchema {
  collectionName: "components_custom_tip_lists";
  info: {
    displayName: "Tip List";
    icon: "collapse";
  };
  attributes: {
    description: Schema.Attribute.Text;
    layout: Schema.Attribute.Enumeration<["Basic", "Single"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Basic">;
    tips: Schema.Attribute.Relation<"manyToMany", "api::tip.tip">;
    title: Schema.Attribute.Component<"shared.title", false>;
  };
}

export interface CustomTool extends Struct.ComponentSchema {
  collectionName: "components_custom_tools";
  info: {
    displayName: "Tool";
    icon: "command";
  };
  attributes: {
    cta_label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Find my tips">;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Explainer copy guiding user on how to upload a recipe to the tool and mentioning several popular sites the tool works with.">;
    upload_label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Image Upload">;
    upload_placeholder: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Upload Image">;
    url_label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Recipe URL">;
    url_placeholder: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Enter URL">;
  };
}

export interface SharedAccordionItem extends Struct.ComponentSchema {
  collectionName: "components_shared_accordion_items";
  info: {
    displayName: "AccordionItem";
  };
  attributes: {
    description: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedAssetsCards extends Struct.ComponentSchema {
  collectionName: "components_shared_assets_cards";
  info: {
    displayName: "Assets Cards";
  };
  attributes: {
    cta: Schema.Attribute.Component<"shared.links", false>;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    displayMode: Schema.Attribute.Enumeration<
      [
        "aspect-16/9",
        "aspect-9/16",
        "aspect-4/5",
        "aspect-1/1",
        "aspect-4/5 10 second",
      ]
    > &
      Schema.Attribute.Required;
    file: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios"> &
      Schema.Attribute.Required;
    label: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedCta extends Struct.ComponentSchema {
  collectionName: "components_shared_ctas";
  info: {
    displayName: "cta";
  };
  attributes: {
    href: Schema.Attribute.String;
    label: Schema.Attribute.String;
    page: Schema.Attribute.Relation<"manyToOne", "api::page.page">;
  };
}

export interface SharedEmojiItem extends Struct.ComponentSchema {
  collectionName: "components_shared_emoji_items";
  info: {
    displayName: "EmojiItem";
  };
  attributes: {
    category: Schema.Attribute.Relation<"oneToOne", "api::category.category">;
    emoji: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedFeatureCard extends Struct.ComponentSchema {
  collectionName: "components_shared_feature_cards";
  info: {
    displayName: "Feature Card";
  };
  attributes: {
    category: Schema.Attribute.Relation<"oneToOne", "api::category.category">;
  };
}

export interface SharedIconlink extends Struct.ComponentSchema {
  collectionName: "components_shared_iconlinks";
  info: {
    displayName: "iconlink";
  };
  attributes: {
    href: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedIngredientCard extends Struct.ComponentSchema {
  collectionName: "components_shared_ingredient_cards";
  info: {
    displayName: "IngredientCard";
  };
  attributes: {
    category: Schema.Attribute.Relation<"oneToOne", "api::category.category">;
  };
}

export interface SharedInputCard extends Struct.ComponentSchema {
  collectionName: "components_shared_input_cards";
  info: {
    displayName: "InputCard";
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    link: Schema.Attribute.Component<"shared.links", false>;
    title: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface SharedLinks extends Struct.ComponentSchema {
  collectionName: "components_shared_links";
  info: {
    displayName: "Links";
  };
  attributes: {
    buttonType: Schema.Attribute.Enumeration<["Primary", "Secondary"]>;
    href: Schema.Attribute.String;
    isButton: Schema.Attribute.Boolean;
    isDisplay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedLogoItem extends Struct.ComponentSchema {
  collectionName: "components_shared_logo_items";
  info: {
    displayName: "LogoItem";
  };
  attributes: {};
}

export interface SharedOverlayLink extends Struct.ComponentSchema {
  collectionName: "components_shared_overlay_links";
  info: {
    displayName: "OverlayLink";
  };
  attributes: {
    href: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    overlayDescription: Schema.Attribute.Blocks;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: "components_shared_seos";
  info: {
    displayName: "seo";
    icon: "code";
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaKeywords: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String;
  };
}

export interface SharedSmallCard extends Struct.ComponentSchema {
  collectionName: "components_shared_small_cards";
  info: {
    displayName: "SmallCard";
  };
  attributes: {
    category: Schema.Attribute.Relation<"oneToOne", "api::category.category">;
  };
}

export interface SharedSpotlightItem extends Struct.ComponentSchema {
  collectionName: "components_shared_spotlight_items";
  info: {
    displayName: "SpotlightItem";
  };
  attributes: {
    copy: Schema.Attribute.String & Schema.Attribute.Required;
    video: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
  };
}

export interface SharedStandardCard extends Struct.ComponentSchema {
  collectionName: "components_shared_standard_cards";
  info: {
    displayName: "StandardCard";
  };
  attributes: {
    category: Schema.Attribute.Relation<"oneToOne", "api::category.category">;
  };
}

export interface SharedTitle extends Struct.ComponentSchema {
  collectionName: "components_shared_titles";
  info: {
    displayName: "title";
  };
  attributes: {
    copy: Schema.Attribute.String;
    header: Schema.Attribute.Enumeration<["h1", "h2", "h3", "h4", "h5", "h6"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"h2">;
  };
}

declare module "@strapi/strapi" {
  export module Public {
    export interface ComponentSchemas {
      "component.404": Component404;
      "component.5050-text-and-image": Component5050TextAndImage;
      "component.accordion": ComponentAccordion;
      "component.carousel": ComponentCarousel;
      "component.carousel-small": ComponentCarouselSmall;
      "component.carousel-standard": ComponentCarouselStandard;
      "component.category-carousel-feature": ComponentCategoryCarouselFeature;
      "component.category-detail": ComponentCategoryDetail;
      "component.category-emoji": ComponentCategoryEmoji;
      "component.content-spotlight": ComponentContentSpotlight;
      "component.guide": ComponentGuide;
      "component.header": ComponentHeader;
      "component.hero": ComponentHero;
      "component.highlight-component": ComponentHighlightComponent;
      "component.ingredient-carousel": ComponentIngredientCarousel;
      "component.link-list": ComponentLinkList;
      "component.loading": ComponentLoading;
      "component.logo-cards": ComponentLogoCards;
      "component.search": ComponentSearch;
      "component.teaser": ComponentTeaser;
      "component.text-and-image-card": ComponentTextAndImageCard;
      "component.tip-banner": ComponentTipBanner;
      "component.tips-popup": ComponentTipsPopup;
      "component.tool-input": ComponentToolInput;
      "component.tool-spotlight": ComponentToolSpotlight;
      "component.toolkit": ComponentToolkit;
      "component.toolkit-headline": ComponentToolkitHeadline;
      "component.toolkit-parent-category": ComponentToolkitParentCategory;
      "custom.search": CustomSearch;
      "custom.tip-list": CustomTipList;
      "custom.tool": CustomTool;
      "shared.accordion-item": SharedAccordionItem;
      "shared.assets-cards": SharedAssetsCards;
      "shared.cta": SharedCta;
      "shared.emoji-item": SharedEmojiItem;
      "shared.feature-card": SharedFeatureCard;
      "shared.iconlink": SharedIconlink;
      "shared.ingredient-card": SharedIngredientCard;
      "shared.input-card": SharedInputCard;
      "shared.links": SharedLinks;
      "shared.logo-item": SharedLogoItem;
      "shared.overlay-link": SharedOverlayLink;
      "shared.seo": SharedSeo;
      "shared.small-card": SharedSmallCard;
      "shared.spotlight-item": SharedSpotlightItem;
      "shared.standard-card": SharedStandardCard;
      "shared.title": SharedTitle;
    }
  }
}
