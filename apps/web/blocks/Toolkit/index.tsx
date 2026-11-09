'use client';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from '../types';
import { Typography } from '@/components/Typography';
import { Fragment } from 'react';
import { BlockTitle } from '@/components/BlockTitle';
import { AssecItem } from './AssecItem';
import { ToolkitNav } from './nav';

export type GuideWithModes = cmsType.component.GuideDeepRef & {
  subCategoryModes: Record<string, cmsType.shared.AssetsCardsDeepRef[]>;
};

export function BlockToolkit({ block }: BlockProps<cmsType.component.ToolkitDeepRef>) {
  const toolkitCategory = block.toolkitCategory.map((item) => ({
    ...item,
    subCategory: item.subCategory.map((subItem): GuideWithModes => ({
      ...subItem,
      subCategoryModes: subItem.assets.reduce<Record<string, cmsType.shared.AssetsCardsDeepRef[]>>(
        (groups, asset) => {
          (groups[asset.label] ??= []).push(asset);
          return groups;
        },
        {},
      ),
    })),
  }));
  return (
    <div className="flex flex-col lg:flex-row lg:gap-35 lg:pb-15">
      <ToolkitNav navList={toolkitCategory} />
      <div className=" bg-surface-sand px-5 py-15 lg:px-15 flex flex-col gap-10 lg:rounded-md">
        {toolkitCategory.map((item) => (
          <div key={item.id} className="">
            {item.subCategory.map((subItem, index) => (
              <Fragment key={subItem.id}>
                <div id={subItem.title.copy || ''}>
                  <BlockTitle
                    title={subItem.title}
                    moduleIndex={1}
                    className={`${index !== 0 ? 'mt-10' : ''}`}
                  />
                </div>

                <Typography variant="paragraph-lg" className="mt-5">
                  {subItem.description}
                </Typography>
                {Object.entries(subItem.subCategoryModes).map(([key, assets]) => (
                  <div key={key} className="mt-10 flex flex-col gap-10">
                    <Typography variant="headline-xs" className="uppercase">
                      {key}
                    </Typography>
                    <div
                      className={`grid gap-10 ${key.startsWith('16x') ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}
                    >
                      {assets.map((asset) => (
                        <AssecItem key={asset.title} {...asset} />
                      ))}
                    </div>
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
