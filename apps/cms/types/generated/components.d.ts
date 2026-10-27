import type { Schema, Struct } from "@strapi/strapi";

export interface Component5050TextAndImage extends Struct.ComponentSchema {
  collectionName: "components_component_5050_text_and_images";
  info: {
    displayName: "5050 Text & Image";
  };
  attributes: {
    Add_Background_Color: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Make_Image_left: Schema.Attribute.Boolean;
    Position_of_Adding_BgColor: Schema.Attribute.Enumeration<["Up ", "Down"]>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentAccordion extends Struct.ComponentSchema {
  collectionName: "components_component_accordions";
  info: {
    displayName: "Accordion";
  };
  attributes: {
    AccordionItem: Schema.Attribute.Component<"shared.accordion-item", true>;
    SubTitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
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
    Description: Schema.Attribute.Text;
    SmallCard: Schema.Attribute.Component<"shared.small-card", true>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentCarouselStandard extends Struct.ComponentSchema {
  collectionName: "components_component_carousel_standards";
  info: {
    displayName: "Carousel - Standard";
  };
  attributes: {
    Background_color: Schema.Attribute.Enumeration<["sand", "paper", "terra"]>;
    Card_Background_color: Schema.Attribute.Enumeration<["Bright Yellow"]>;
    Description: Schema.Attribute.Text;
    StandardCard: Schema.Attribute.Component<"shared.standard-card", true>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentCategoryCarouselFeature
  extends Struct.ComponentSchema {
  collectionName: "components_component_category_carousel_features";
  info: {
    displayName: "Category Carousel - Feature";
  };
  attributes: {
    Description: Schema.Attribute.Text;
    Feature_Card: Schema.Attribute.Component<"shared.feature-card", true>;
    Link: Schema.Attribute.Component<"shared.links", true>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentCategoryDetail extends Struct.ComponentSchema {
  collectionName: "components_component_category_details";
  info: {
    displayName: "Category Detail";
  };
  attributes: {
    Button: Schema.Attribute.Component<"shared.links", false>;
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios",
      true
    >;
    Popup: Schema.Attribute.Component<"component.tips-popup", false>;
    Statement: Schema.Attribute.Blocks;
    SubTitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentCategoryEmoji extends Struct.ComponentSchema {
  collectionName: "components_component_category_emojis";
  info: {
    displayName: "Category - Emoji";
  };
  attributes: {
    Description: Schema.Attribute.Text;
    Emoji: Schema.Attribute.Component<"shared.emoji-item", true>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentContentSpotlight extends Struct.ComponentSchema {
  collectionName: "components_component_content_spotlights";
  info: {
    displayName: "Content Spotlight";
  };
  attributes: {
    Background_color: Schema.Attribute.Enumeration<["paper", "sand"]>;
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Make_Image_left: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentFooter extends Struct.ComponentSchema {
  collectionName: "components_component_footers";
  info: {
    displayName: "Footer";
  };
  attributes: {
    Iconlink: Schema.Attribute.Component<"shared.iconlink", true>;
    Legal_Copy: Schema.Attribute.Text;
    Link: Schema.Attribute.Component<"shared.links", true>;
    Overlaylink: Schema.Attribute.Component<"shared.overlay-link", true>;
  };
}

export interface ComponentHeader extends Struct.ComponentSchema {
  collectionName: "components_component_headers";
  info: {
    displayName: "Header";
  };
  attributes: {
    Add_background_color: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    Background_color: Schema.Attribute.Enumeration<["terra", "forest"]>;
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Position_of_Adding_BgColor: Schema.Attribute.Enumeration<["up", "down"]>;
    SubTitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentHero extends Struct.ComponentSchema {
  collectionName: "components_component_heroes";
  info: {
    displayName: "Hero";
    icon: "crown";
  };
  attributes: {
    Description: Schema.Attribute.Text;
    images: Schema.Attribute.Media<"images" | "files" | "videos", true>;
    Link: Schema.Attribute.Component<"shared.links", true>;
    Title: Schema.Attribute.Blocks;
  };
}

export interface ComponentHighlightComponent extends Struct.ComponentSchema {
  collectionName: "components_component_highlight_components";
  info: {
    displayName: "Highlight Component";
  };
  attributes: {
    Background_color: Schema.Attribute.Enumeration<
      ["forest-tint", "paper", "forest"]
    >;
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Link: Schema.Attribute.Component<"shared.links", true>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentIngredientCarousel extends Struct.ComponentSchema {
  collectionName: "components_component_ingredient_carousel_s";
  info: {
    displayName: "Ingredient Carousel ";
  };
  attributes: {
    Description: Schema.Attribute.Text;
    IngredientCard: Schema.Attribute.Component<"shared.ingredient-card", true>;
    Title: Schema.Attribute.String;
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
    Statement: Schema.Attribute.Text;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentLogoCards extends Struct.ComponentSchema {
  collectionName: "components_component_logo_cards";
  info: {
    displayName: "Logo Cards";
  };
  attributes: {
    Background_color: Schema.Attribute.Enumeration<["paper", "forest"]>;
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios",
      true
    >;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentNavigation extends Struct.ComponentSchema {
  collectionName: "components_component_navigations";
  info: {
    displayName: "Navigation";
  };
  attributes: {
    Link: Schema.Attribute.Component<"shared.links", true>;
    Searchplaceholder: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentSearch extends Struct.ComponentSchema {
  collectionName: "components_component_searches";
  info: {
    displayName: "Search";
  };
  attributes: {
    Button: Schema.Attribute.Component<"shared.links", false>;
    Description: Schema.Attribute.Text;
    Hint: Schema.Attribute.Text;
    Placeholder: Schema.Attribute.String;
    Popup: Schema.Attribute.Component<"component.tips-popup", false>;
    Statement: Schema.Attribute.Blocks;
    Title: Schema.Attribute.String;
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
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<
      "images" | "files" | "videos" | "audios",
      true
    >;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentTipBanner extends Struct.ComponentSchema {
  collectionName: "components_component_tip_banners";
  info: {
    displayName: "Tip Banner";
  };
  attributes: {
    Background_color: Schema.Attribute.Enumeration<["terra", "forest"]>;
    CTA: Schema.Attribute.Component<"shared.links", true>;
    Label: Schema.Attribute.String;
    tip: Schema.Attribute.Relation<"oneToOne", "api::tip.tip">;
  };
}

export interface ComponentTipsPopup extends Struct.ComponentSchema {
  collectionName: "components_component_tips_popups";
  info: {
    displayName: "Tips Popup";
  };
  attributes: {
    Description: Schema.Attribute.Text;
    Link: Schema.Attribute.Component<"shared.links", false>;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentToolInput extends Struct.ComponentSchema {
  collectionName: "components_component_tool_inputs";
  info: {
    displayName: "Tool Input";
  };
  attributes: {
    Button: Schema.Attribute.Component<"shared.links", true>;
    CardDescription: Schema.Attribute.Text;
    Cards: Schema.Attribute.Component<"shared.input-card", true>;
    CardTitle: Schema.Attribute.String;
    Copy: Schema.Attribute.String;
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Placeholder: Schema.Attribute.String;
    SubTitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface ComponentToolSpotlight extends Struct.ComponentSchema {
  collectionName: "components_component_tool_spotlights";
  info: {
    displayName: "Tool Spotlight";
  };
  attributes: {
    Link: Schema.Attribute.Component<"shared.links", false>;
    SpotlightItem: Schema.Attribute.Component<"shared.spotlight-item", true>;
    SubTitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
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
    Description: Schema.Attribute.String;
    Label: Schema.Attribute.String;
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
    Emoji: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SharedFeatureCard extends Struct.ComponentSchema {
  collectionName: "components_shared_feature_cards";
  info: {
    displayName: "Feature_Card";
  };
  attributes: {
    Image: Schema.Attribute.Media<"images" | "files">;
    Title: Schema.Attribute.String;
  };
}

export interface SharedIconlink extends Struct.ComponentSchema {
  collectionName: "components_shared_iconlinks";
  info: {
    displayName: "iconlink";
  };
  attributes: {
    href: Schema.Attribute.String;
    Image: Schema.Attribute.Media<"images" | "files">;
    Label: Schema.Attribute.String;
  };
}

export interface SharedIngredientCard extends Struct.ComponentSchema {
  collectionName: "components_shared_ingredient_cards";
  info: {
    displayName: "IngredientCard";
  };
  attributes: {
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Title: Schema.Attribute.String;
  };
}

export interface SharedInputCard extends Struct.ComponentSchema {
  collectionName: "components_shared_input_cards";
  info: {
    displayName: "InputCard";
  };
  attributes: {
    Description: Schema.Attribute.Text;
    Icon: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Link: Schema.Attribute.Component<"shared.links", false>;
    Title: Schema.Attribute.Text;
  };
}

export interface SharedLinks extends Struct.ComponentSchema {
  collectionName: "components_shared_links";
  info: {
    displayName: "Links";
  };
  attributes: {
    Buttontype: Schema.Attribute.Enumeration<["Primary", "Secondary"]>;
    href: Schema.Attribute.String;
    isButton: Schema.Attribute.Boolean;
    isDisplay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    Label: Schema.Attribute.String;
    NewTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
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
    Label: Schema.Attribute.String;
    Overlay_description: Schema.Attribute.Blocks;
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
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Title: Schema.Attribute.String;
  };
}

export interface SharedSpotlightItem extends Struct.ComponentSchema {
  collectionName: "components_shared_spotlight_items";
  info: {
    displayName: "SpotlightItem";
  };
  attributes: {
    Copy: Schema.Attribute.String;
    Video: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
  };
}

export interface SharedStandardCard extends Struct.ComponentSchema {
  collectionName: "components_shared_standard_cards";
  info: {
    displayName: "StandardCard";
  };
  attributes: {
    Image: Schema.Attribute.Media<"images" | "files" | "videos" | "audios">;
    Title: Schema.Attribute.Text;
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
      Schema.Attribute.DefaultTo<"h3">;
  };
}

declare module "@strapi/strapi" {
  export module Public {
    export interface ComponentSchemas {
      "component.5050-text-and-image": Component5050TextAndImage;
      "component.accordion": ComponentAccordion;
      "component.carousel": ComponentCarousel;
      "component.carousel-small": ComponentCarouselSmall;
      "component.carousel-standard": ComponentCarouselStandard;
      "component.category-carousel-feature": ComponentCategoryCarouselFeature;
      "component.category-detail": ComponentCategoryDetail;
      "component.category-emoji": ComponentCategoryEmoji;
      "component.content-spotlight": ComponentContentSpotlight;
      "component.footer": ComponentFooter;
      "component.header": ComponentHeader;
      "component.hero": ComponentHero;
      "component.highlight-component": ComponentHighlightComponent;
      "component.ingredient-carousel": ComponentIngredientCarousel;
      "component.link-list": ComponentLinkList;
      "component.loading": ComponentLoading;
      "component.logo-cards": ComponentLogoCards;
      "component.navigation": ComponentNavigation;
      "component.search": ComponentSearch;
      "component.teaser": ComponentTeaser;
      "component.text-and-image-card": ComponentTextAndImageCard;
      "component.tip-banner": ComponentTipBanner;
      "component.tips-popup": ComponentTipsPopup;
      "component.tool-input": ComponentToolInput;
      "component.tool-spotlight": ComponentToolSpotlight;
      "custom.search": CustomSearch;
      "custom.tip-list": CustomTipList;
      "custom.tool": CustomTool;
      "shared.accordion-item": SharedAccordionItem;
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
