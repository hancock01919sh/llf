'use client';
import { Typography } from '@/components/Typography';
import type { ToolInputProps } from '.';
import { useEffect, useMemo, useState } from 'react';
import type { BlockProps } from '../types';
import { IconClose, IconUpload } from '@/components/Icon';
import { ExtractRequest } from '@llf/contracts/find-tips';
import Image from 'next/image';
export function Tool(props: BlockProps<ToolInputProps> & { className?: string }) {
  const { block } = props;
  const findTipsLabel = block.Button[2]?.Label as string;
  const tabs = block.Button.map((item) => item.Label).slice(0, 2);
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
  function handleSubmit() {
    const submitData = linkText
      ? { inputType: 'url', url: linkText }
      : {
          inputType: 'image',
          mimeType: uploadInfo?.type,
          imageBase64: uploadInfo?.imageBase64,
        };
    const result = ExtractRequest.safeParse(submitData);
    if (!result.success) {
      console.error('result error', result.error.message);
      return;
    }
    fetch('/api/find-tips/extract', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(result.data),
    })
      .then((res) => res.json())
      .then(() => {
        // data: { matches: Array<{ slug: string }> }
        // console.log(
        //   'ai response data:',
        //   data?.matches.map((item) => item.slug),
        // );
      });
  }
  return (
    <div className={`${props.className || ''} flex flex-col gap-5`}>
      <div className=" flex flex-center overflow-hidden rounded-md">
        {tabs.map((item, index) => (
          <button
            className={` cursor-pointer flex-center justify-center w-1/2 py-5 capitalize font-bold ${activeTab === item ? 'bg-surface-paper text-ink-terra' : 'bg-ink-terra text-surface-sand'}`}
            key={index}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {activeTab === tabs[0] && (
        <div
          className={`h-12.5 transition-colors duration-300 ${linkActive ? 'bg-semantic-leaf text-surface-mint' : 'bg-surface-paper text-ink-terra'}  p-[1.5px] overflow-hidden rounded-full flex-center `}
        >
          <input
            placeholder={block.Placeholder}
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
              <input
                type="file"
                accept="image/*"
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

      <Typography variant="paragraph-sm">{props.block.Copy}</Typography>
    </div>
  );
}
