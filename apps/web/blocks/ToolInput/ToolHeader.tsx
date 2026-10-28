'use client';
import { ModuleBoundary } from '@/components/ModuleBoundary';
import type { ToolInputProps } from '.';
import { Typography } from '@/components/Typography';
import { Tool } from './Tool';
import { UIVideo } from '@/components/UIVideo';
import { useAdjacent } from '@/components/hooks/useAdjacent';
import { useEffect, useRef, useState } from 'react';
import { useDevice } from '@/components/hooks/useDevice';
import type { BlockProps } from '../types';

export function ToolHeader(props: BlockProps<ToolInputProps>) {
  const ref = useRef(null);
  const adjacent = useAdjacent({ originalRef: ref });
  const [nextSection, setNextSection] = useState<HTMLElement>();
  const { isMobile } = useDevice();
  const nextSectionBgColor = useRef<string>('');
  useEffect(() => {
    if (adjacent.next) {
      nextSectionBgColor.current = getComputedStyle(adjacent.next as HTMLElement).backgroundColor;
      setNextSection(adjacent.next);
    }
  }, [adjacent]);
  const getNextBgRatio = () => (isMobile ? '47vw' : '54px');
  return (
    <>
      <ModuleBoundary
        ref={ref}
        surface="forest"
        type="tool-header"
        className="pt-15 lg:flex lg:gap-33 lg:pb-0 aspect-1400/740"
        style={{
          backgroundImage: `${nextSection ? 'linear-gradient(0deg, ' + nextSectionBgColor.current + ' 0% ' + getNextBgRatio() + ', var(--color-brand-forest) ' + getNextBgRatio() + ' 100%)' : ''}`,
          boxShadow: `${nextSection ? `0 1px 1px ` + nextSectionBgColor.current : ''}`,
        }}
      >
        <div className="lg:max-w-1/2">
          <Typography variant="eyebrow" className=" font-bold">
            {props.block.SubTitle}
          </Typography>
          <Typography variant="headline-lg" className="uppercase mt-10 ">
            {props.block.Title}
          </Typography>
          <Typography variant="subhead-lg" className="font-bold mt-5">
            {props.block.Description}
          </Typography>
          <Tool {...props} className="mt-10" />
        </div>
        <UIVideo
          className="mt-10 lg:mt-0 aspect-363/272 lg:aspect-538/698  rounded-md lg:max-w-2/5"
          src={props.block.Image.url || ''}
        />
      </ModuleBoundary>
    </>
  );
}
