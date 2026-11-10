'use client';
import { useState } from 'react';
import { Typography } from '@/components/Typography';
import type { BlockProps } from '../types';
import { AccordionItemComponent } from './AccordionItem';
import type { cmsType } from '@llf/contracts';
import { BlockTitle } from '@/components/BlockTitle';

export function BlockAccordion(props: BlockProps<cmsType.component.Accordion>) {
  const { accordionItem, subTitle, title } = props.block;
  const [data, setData] = useState(
    accordionItem?.map((item) => ({
      ...item,
      isExpanded: false,
    })),
  );
  return (
    <div className="py-15 lg:w-[60%]! mx-auto lg:py-[6.94%]">
      <BlockTitle title={title!} moduleIndex={props.index} className="text-center" />

      <Typography variant="subhead-lg" richText={true} className=" mt-2.5 lg:text-center lg:mt-5">
        {subTitle}
      </Typography>
      <div className="flex flex-col gap-2.5 mt-lg" aria-label={title?.copy || ''}>
        {data.map((item, _index) => (
          <AccordionItemComponent
            key={item.label}
            {...item}
            isExpanded={item.isExpanded}
            toggleIsExpanded={(isExpanded) => {
              setData((prev) =>
                prev.map((item, index) => ({
                  ...item,
                  isExpanded: index === _index ? isExpanded : false,
                })),
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
