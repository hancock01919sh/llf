'use client';
import TransitionLink from '@/components/TransitionLink';
import { Typography } from '@/components/Typography';
import type { cmsType } from '@llf/contracts';
import { Fragment } from 'react/jsx-runtime';

export function HeroContent({
  data,
  className = '',
}: {
  data: cmsType.component.Hero;
  className?: string;
}) {
  const { Link, Description } = data;
  return (
    <div className={className}>
      <Typography variant="subhead-lg" className="mt-10">
        {Description}
      </Typography>
      <div className="flex flex-col gap-lg items-center justify-center lg:flex-row lg:justify-start mt-10.75 lg:mt-6.25 ">
        {Link?.filter((l) => l.isDisplay).map((l) => {
          if (l.Buttontype === 'Primary') {
            return (
              <TransitionLink
                key={l.Label + 'btn'}
                href={l.href || '#'}
                className="btn w-full lg:w-max lg:mt-0"
              >
                {l.Label}
              </TransitionLink>
            );
          } else {
            return (
              <Fragment key={l.Label}>
                <TransitionLink
                  href={l.href || '/search'}
                  className="link mx-auto block w-max lg:hidden"
                >
                  {l.Label}
                </TransitionLink>
                <TransitionLink
                  href={l.href || '/search'}
                  className="btn black hidden lg:block lg:w-max"
                >
                  {l.Label}
                </TransitionLink>
              </Fragment>
            );
          }
        })}
      </div>
    </div>
  );
}
