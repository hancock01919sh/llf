'use client';
import { useState } from 'react';
import { Typography } from '@/components/Typography';
import { AccordionItemComponent } from './AccordionItem';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from '../types';

export function Accordion(props: BlockProps<cmsType.component.Accordion>) {
  const { AccordionItem, SubTitle, Title } = props.block;
  const [data, setData] = useState(
    AccordionItem?.map((item: cmsType.shared.AccordionItem) => ({
      ...item,
      isExpanded: false,
    })),
  );
  return (
    <div className="py-15 lg:w-[60%]! mx-auto lg:py-[6.94%]">
      <Typography variant="headline-md" className=" uppercase lg:text-center">
        {Title}
      </Typography>

      <Typography variant="subhead-lg" richText={true} className=" mt-2.5 lg:text-center lg:mt-5">
        {SubTitle}
      </Typography>
      <div className="flex flex-col gap-2.5 mt-lg">
        {data?.map((item, _index) => (
          <AccordionItemComponent
            key={item.Label}
            {...item}
            isExpanded={item.isExpanded}
            toggleIsExpanded={(isExpanded) => {
              setData((prev) =>
                prev?.map((item, index) => ({
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
