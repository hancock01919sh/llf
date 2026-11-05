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
  const { link, description } = data;
  return (
    <div className={className}>
      <Typography variant="subhead-lg" className="mt-10">
        {description}
      </Typography>
      <div className="flex flex-col gap-lg items-center justify-center lg:flex-row lg:justify-start mt-10.75 lg:mt-6.25 ">
        {link
          ?.filter((l) => l.isDisplay)
          .map((l) => {
            if (l.buttonType === 'Primary') {
              return (
                <TransitionLink
                  key={l.label + 'btn'}
                  href={l.href || '#'}
                  className="btn w-full lg:w-max lg:mt-0"
                >
                  {l.label}
                </TransitionLink>
              );
            } else {
              return (
                <Fragment key={l.label}>
                  <TransitionLink
                    href={l.href || '/search'}
                    className="link mx-auto block w-max lg:hidden"
                  >
                    {l.label}
                  </TransitionLink>
                  <TransitionLink
                    href={l.href || '/search'}
                    className="btn black hidden lg:block lg:w-max"
                  >
                    {l.label}
                  </TransitionLink>
                </Fragment>
              );
            }
          })}
      </div>
    </div>
  );
}
