'use client';
import type { cmsType } from '@llf/contracts';
import type { GuideWithModes } from '.';
import { Typography } from '@/components/Typography';
import { useState } from 'react';
import { IconArrow } from '@/components/Icon';
import { DropdownMenu } from 'radix-ui';
export function ToolkitNav(props: {
  navList: cmsType.component.ToolkitParentCategoryDeepRef[];
  onChange: (id: number) => void;
}) {
  const { navList, onChange } = props;
  const [selected, setSelected] = useState(navList[0]?.title.copy || '');
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden">
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
          <DropdownMenu.Trigger className="w-dvw lg:w-50 font-bold capitalize flex-center justify-between p-5 border-t border-b border-ink-terra-15">
            {selected}
            <IconArrow point={open ? 'up' : 'down'}></IconArrow>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            className="bg-surface-paper z-1 w-dvw lg:w-50 text-ink-terra-40"
          >
            {navList
              .map((n) => ({
                ...n,
                subCategoryModes: n.subCategory.map((sub) => sub as unknown as GuideWithModes),
              }))
              .map((nav) => {
                return (
                  <div key={nav.id} className="w-full">
                    <DropdownMenu.Item
                      key={nav.id}
                      className="w-full"
                      onClick={() => {
                        onChange(nav.id);
                        setSelected(nav.title.copy || '');
                      }}
                    >
                      <Typography
                        variant="subhead-md"
                        className={`p-5 font-bold capitalize border-t border-t-ink-terra-15 w-full ${selected === nav.title.copy ? 'text-ink-terra' : ''}`}
                      >
                        {nav.title.copy}
                      </Typography>
                    </DropdownMenu.Item>
                    <div>
                      {nav.subCategoryModes.map((sub) => (
                        <DropdownMenu.Item
                          key={sub.id}
                          onClick={() => {
                            onChange(nav.id);
                            setSelected(sub.title.copy || '');
                            setTimeout(() => {
                              document
                                .getElementById(sub.title.copy || '')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            }, 200);
                          }}
                        >
                          <Typography
                            key={sub.id}
                            variant="subhead-md"
                            className={`p-5 pl-10 capitalize font-bold border-t border-t-ink-terra-15 ${selected === sub.title.copy ? 'text-ink-terra' : ''}`}
                          >
                            {sub.title.copy}
                          </Typography>
                        </DropdownMenu.Item>
                      ))}
                    </div>
                  </div>
                );
              })}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <div className="hidden lg:block text-ink-terra-40">
        {navList
          .map((n) => ({
            ...n,
            subCategoryModes: n.subCategory.map((sub) => sub as unknown as GuideWithModes),
          }))
          .map((nav) => {
            return (
              <div key={nav.id} className="w-full">
                <Typography
                  onClick={() => {
                    onChange(nav.id);
                    setSelected(nav.title.copy || '');
                    // document
                    //   .getElementById(nav.subCategoryModes[0]?.title.copy || '')
                    //   ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="subhead-md"
                  className={`p-5 font-bold capitalize text-nowrap cursor-pointer w-full ${selected === nav.title.copy ? 'text-ink-terra' : ''}`}
                >
                  {nav.title.copy}
                </Typography>
                <div>
                  {nav.subCategoryModes.map((sub) => (
                    <Typography
                      key={sub.id}
                      onClick={() => {
                        onChange(nav.id);
                        setSelected(sub.title.copy || '');
                        setTimeout(() => {
                          document
                            .getElementById(sub.title.copy || '')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }, 200);
                      }}
                      variant="subhead-md"
                      className={`p-5 pl-10 capitalize font-bold cursor-pointer  text-nowrap ${selected === sub.title.copy ? 'text-ink-terra' : ''}`}
                    >
                      {sub.title.copy}
                    </Typography>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
