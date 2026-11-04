'use client';
import { Typography } from '@/components/Typography';
import { useEffect, useMemo, useState } from 'react';
import type { BlockProps } from '../types';
import { IconClose, IconUpload } from '@/components/Icon';
import { ExtractRequest, ExtractResponse, IMAGE_MIME_TYPES } from '@llf/contracts/find-tips';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { resultsHref } from '@/lib/paths';
import type { cmsType } from '@llf/contracts';
export function Tool(props: BlockProps<cmsType.component.ToolInput> & { className?: string }) {
  const { block } = props;
  const findTipsLabel = block.button?.[2]?.label as string;
  const tabs = block.button?.map((item) => item.label).slice(0, 2) || [];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [linkActive, setLinkActive] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [uploadInfo, setUploadInfo] = useState<{
    name: string;
    type: string;
    imageBase64: string;
  } | null>(null);
  useEffect(() => {
    setLinkActive(false);
    setUploadInfo(null);
    setLinkText('');
  }, [activeTab]);
  const imageActive = useMemo(() => uploadInfo !== null, [uploadInfo]);

  const router = useRouter();

  async function handleSubmit() {
    const submitData = linkText
      ? { inputType: 'url', url: linkText }
      : { inputType: 'image', mimeType: uploadInfo?.type, imageBase64: uploadInfo?.imageBase64 };
    // const submitData = { inputType: 'text', text: 'bananas, milk, saffron' };

    const { data, success } = ExtractRequest.safeParse(submitData);
    if (!success) {
      console.error('Invalid input data:', submitData);
      return;
    }

    const res = await fetch('/api/find-tips/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;

    const parsed = ExtractResponse.safeParse(await res.json());
    if (!parsed.success || parsed.data.matches.length === 0) return;

    // 只把 CMS catalog 里的 slug 带进 URL，模型原始输出不进 URL（AGENTS.md 硬规则）
    router.push(resultsHref(parsed.data.matches.map((m) => m.slug)));
  }
  return (
    <div className={`${props.className || ''} flex flex-col gap-5`}>
      <div
        role="tablist"
        aria-label={`${activeTab === tabs[0] ? 'Input' : 'Upload'} method`}
        className=" flex flex-center overflow-hidden rounded-md"
      >
        {tabs.map((item, index) => (
          <button
            className={`cursor-pointer flex-center justify-center w-1/2 py-5 capitalize font-bold ${activeTab === item ? 'bg-surface-paper text-ink-terra' : 'bg-ink-terra text-surface-sand'}`}
            key={index}
            role="tab"
            id={`tool-tab-${index}`}
            aria-selected={activeTab === item}
            aria-controls={`tool-panel-${index}`}
            onClick={() => setActiveTab(item)}
            name={item}
          >
            {item}
          </button>
        ))}
      </div>
      {activeTab === tabs[0] && (
        <div
          role="tabpanel"
          id="tool-panel-0"
          aria-labelledby="tool-tab-0"
          className={`h-12.5 transition-colors duration-300 ${linkActive ? 'bg-semantic-leaf text-surface-mint' : 'bg-surface-paper text-ink-terra'}  p-[1.5px] overflow-hidden rounded-full flex-center `}
        >
          <input
            type="text"
            placeholder={block?.placeholder || ''}
            aria-label={block?.placeholder || tabs[0]}
            name="input-url"
            className="flex-1  mx-4 outline-none"
            onInput={(e) => {
              setLinkText((e.target as HTMLInputElement).value.trim());
              const urlReg = /^https?:\/\//;
              if (urlReg.test((e.target as HTMLInputElement).value.trim().toLowerCase())) {
                setLinkActive(true);
              } else {
                setLinkActive(false);
              }
            }}
          />
          <button
            onClick={() => {
              handleSubmit();
            }}
            disabled={!linkActive}
            className={`cursor-pointer shrink-0 capitalize ${linkActive ? 'bg-surface-mint ' : 'bg-surface-forest-tint'} text-ink-terra font-bold rounded-full py-4 px-lg`}
          >
            {findTipsLabel}
          </button>
        </div>
      )}
      {activeTab === tabs[1] && (
        <div
          role="tabpanel"
          id="tool-panel-1"
          aria-labelledby="tool-tab-1"
          className={`relative flex flex-center justify-between pl-3.5 gap-2.5 h-12.5 rounded-full border border-dashed border-ink-terra-15 ${imageActive ? 'bg-semantic-leaf' : 'bg-brand-forest'} `}
        >
          <div
            className={`w-8 h-8 rounded-full flex-center justify-center ${imageActive ? 'bg-[rgba(0,0,0,0.2)]' : 'bg-semantic-leaf'}`}
          >
            {imageActive ? (
              <IconClose
                className="[&_rect]:fill-surface-paper w-1/2 h-1/2"
                onClick={() => {
                  setUploadInfo(null);
                }}
                role="button"
                aria-label="clean image"
              />
            ) : (
              <IconUpload className="[&_path]:fill-surface-mint w-1/2 h-1/2" />
            )}
          </div>
          {!imageActive && (
            <>
              <span className=" text-mob-input text-ink-terra-40 flex-1">
                Upload an image of a shopping list or receipt
              </span>
              {/* IMAGE_MIME_TYPES webp,jpeg,png */}
              <input
                type="file"
                accept={IMAGE_MIME_TYPES.join(',')}
                className="absolute opacity-0 inset-0 flex-1 text-ink-terra mx-4 outline-none min-w-0 border border-red-500"
                onChange={(eInput) => {
                  if (eInput.target.files && eInput.target.files[0]) {
                    const file = eInput.target.files[0];
                    const { name, type } = file;
                    const reader = new FileReader();
                    reader.readAsDataURL(file as Blob);
                    reader.onload = (e) => {
                      setUploadInfo({
                        name,
                        type,
                        imageBase64: e.target?.result as string,
                      });
                    };
                  } else {
                    setUploadInfo(null);
                  }
                }}
              />
            </>
          )}

          {imageActive && uploadInfo && (
            <div className="flex flex-center justify-start flex-1 gap-2.5">
              <Image
                className="rounded-full h-8 aspect-square"
                src={uploadInfo.imageBase64}
                alt={uploadInfo.name}
                width={32}
                height={32}
              />
              <span className="text-mob-input ">{uploadInfo?.name}</span>
            </div>
          )}

          {imageActive && (
            <button
              onClick={() => {
                handleSubmit();
              }}
              className={` cursor-pointer  shrink-0 capitalize bg-surface-mint  text-ink-terra font-bold rounded-full py-4 px-lg`}
            >
              {findTipsLabel}
            </button>
          )}
        </div>
      )}

      <Typography variant="paragraph-sm">{props.block.copy}</Typography>
    </div>
  );
}
