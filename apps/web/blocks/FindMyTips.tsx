'use client';

import type {
  ExtractRequest,
  IngredientMatch,
  InputType,
  ToolErrorReason,
  ToolMode,
  cms,
} from '@llf/contracts';
import { INPUT_TYPES, TEXT_MAX_LENGTH, URL_MAX_LENGTH } from '@llf/contracts';
import { Button, cn } from '@llf/ui';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { format, strings } from '@/content/strings';
import { track } from '@/lib/analytics';
import {
  CLIENT_TIMEOUT_MS,
  IMAGE_ACCEPT,
  STILL_WORKING_MS,
  errorReason,
  fetchToolMode,
  requestExtract,
  resultView,
  saveHandoff,
  toJpegBase64,
  uniqueSlugs,
  validateFile,
  validateText,
  validateUrl,
  type InputProblem,
  type Outcome,
  type ToolHandoff,
} from '@/lib/find-tips';
import { resultsHref } from '@/lib/paths';
import { SEARCH_PATH } from '@/lib/search';
import type { BlockProps } from './types';

const t = strings.tool;

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading'; stillWorking: boolean }
  | {
      kind: 'likely';
      confirmed: IngredientMatch[];
      likely: IngredientMatch[];
      handoff: ToolHandoff;
    }
  | { kind: 'noMatch' }
  | { kind: 'unreadable' }
  | { kind: 'rateLimited'; until: number }
  | { kind: 'error'; reason: ToolErrorReason; retryable: boolean };

const PROBLEM_COPY: Record<InputProblem, string> = {
  empty: t.required,
  invalidUrl: t.invalidUrl,
  unsupportedFile: t.unsupportedFile,
  tooLarge: t.tooLarge,
};

const ERROR_COPY: Record<ToolErrorReason, string> = {
  rate_limited: t.rateLimited,
  challenge: t.challenge,
  timeout: t.timeout,
  invalid_url: t.invalidUrl,
  too_large: t.tooLarge,
  server: t.error,
};

const inputClass =
  'w-full rounded-sm border border-line bg-transparent px-md py-sm text-paragraph text-fg placeholder:text-fg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:border-semantic-tomato';

/**
 * Find My Tips (`custom.tool`, TDD §7.10). Labels come from the CMS block; state copy comes from
 * site strings until the Tool Copy single type exists. User input stays in memory and is only
 * POSTed to `/api/find-tips/extract`; analytics get enums and counts (TDD D20, §8).
 * OPEN-34: the non-happy-path states aren't designed in Figma yet, so they use plain layouts.
 */
export function FindMyTips({ block }: BlockProps<cms.ToolBlock>) {
  const router = useRouter();
  const ids = { base: useId(), hint: useId(), error: useId() };
  const [mode, setMode] = useState<ToolMode | 'checking'>('checking');
  const [tab, setTab] = useState<InputType>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<InputProblem | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    void fetchToolMode().then((next) => {
      if (!active) return;
      setMode(next);
      if (next !== 'live') track({ event: 'tips_tool_unavailable', mode: next });
    });
    return () => {
      active = false;
      controller.current?.abort();
    };
  }, []);

  const until = phase.kind === 'rateLimited' ? phase.until : 0;
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) setPhase({ kind: 'idle' });
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);

  // Move focus to the outcome so screen reader users hear it (TDD §6.6).
  const focusKey = phase.kind === 'idle' || phase.kind === 'loading' ? null : phase.kind;
  useEffect(() => {
    if (focusKey) messageRef.current?.focus();
  }, [focusKey]);

  const busy = phase.kind === 'loading';
  const waitSeconds =
    phase.kind === 'rateLimited' ? Math.max(1, Math.ceil((phase.until - now) / 1000)) : 0;
  const activeTab: InputType = mode === 'jsonld-only' ? 'url' : tab;

  function markStarted() {
    if (started.current) return;
    started.current = true;
    track({ event: 'tips_tool_start', input_type: activeTab });
  }

  function chooseTab(next: InputType) {
    markStarted();
    setTab(next);
    setProblem(null);
  }

  function validate(): InputProblem | null {
    if (activeTab === 'url') return validateUrl(url);
    if (activeTab === 'text') return validateText(text);
    return validateFile(file);
  }

  async function buildRequest(): Promise<ExtractRequest> {
    if (activeTab === 'url') return { inputType: 'url', url: url.trim() };
    if (activeTab === 'text') return { inputType: 'text', text: text.trim() };
    // validateFile has already checked the file exists.
    return {
      inputType: 'image',
      imageBase64: await toJpegBase64(file as File),
      mimeType: 'image/jpeg',
    };
  }

  function navigate(slugs: string[], handoff: ToolHandoff) {
    saveHandoff(handoff);
    router.push(resultsHref(slugs));
  }

  function handleOutcome(outcome: Outcome, inputType: InputType, startedAt: number) {
    const reason = errorReason(outcome);
    if (reason) track({ event: 'tips_tool_error', input_type: inputType, reason });
    switch (outcome.kind) {
      case 'result': {
        const { response } = outcome;
        const view = resultView(response);
        const handoff: ToolHandoff = {
          inputType,
          source: response.source,
          unmatchedCount: response.unmatchedCount,
          latencyMs: Math.round(performance.now() - startedAt),
          catalogVersion: response.catalogVersion,
        };
        if (view.kind === 'navigate') return navigate(view.slugs, handoff);
        if (view.kind === 'likely') return setPhase({ ...view, handoff });
        track({
          event: 'tips_tool_no_match',
          input_type: inputType,
          readable: view.kind === 'noMatch',
        });
        return setPhase(view);
      }
      case 'unavailable':
        track({ event: 'tips_tool_unavailable', mode: 'off' });
        setPhase({ kind: 'idle' });
        return setMode('off');
      case 'rateLimited':
        setNow(Date.now());
        return setPhase({ kind: 'rateLimited', until: Date.now() + outcome.retryAfterMs });
      case 'invalidUrl':
      case 'tooLarge':
      case 'unsupportedFile':
        setPhase({ kind: 'idle' });
        setProblem(outcome.kind);
        return fieldRef.current?.focus();
      case 'error':
        return setPhase({ kind: 'error', reason: outcome.reason, retryable: outcome.retryable });
    }
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy || phase.kind === 'rateLimited') return;
    markStarted();
    const found = validate();
    setProblem(found);
    if (found) {
      fieldRef.current?.focus();
      return;
    }

    const inputType = activeTab;
    const abort = new AbortController();
    controller.current = abort;
    let timedOut = false;
    const startedAt = performance.now();
    setPhase({ kind: 'loading', stillWorking: false });
    const stillWorking = setTimeout(
      () =>
        setPhase((current) =>
          current.kind === 'loading' ? { ...current, stillWorking: true } : current,
        ),
      STILL_WORKING_MS,
    );
    const timeout = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      let body: ExtractRequest;
      try {
        body = await buildRequest();
      } catch {
        // The browser couldn't decode the photo; treat it like an unsupported file.
        setPhase({ kind: 'idle' });
        setProblem('unsupportedFile');
        return;
      }
      if (abort.signal.aborted) throw abort.signal.reason;
      track({ event: 'tips_tool_submit', input_type: inputType });
      handleOutcome(await requestExtract(body, abort.signal), inputType, startedAt);
    } catch {
      if (timedOut)
        handleOutcome({ kind: 'error', reason: 'timeout', retryable: true }, inputType, startedAt);
      else if (abort.signal.aborted) setPhase({ kind: 'idle' });
      else
        handleOutcome({ kind: 'error', reason: 'server', retryable: true }, inputType, startedAt);
    } finally {
      clearTimeout(stillWorking);
      clearTimeout(timeout);
      if (controller.current === abort) controller.current = null;
    }
  }

  function cancel() {
    controller.current?.abort();
  }

  function startOver() {
    setPhase({ kind: 'idle' });
    setProblem(null);
  }

  if (mode === 'checking') {
    return (
      <p role="status" className="text-paragraph text-fg-muted">
        {t.checking}
      </p>
    );
  }

  if (mode === 'off') {
    return (
      <div className="flex flex-col gap-md" data-tool-state="unavailable">
        <p className="text-paragraph">{t.unavailable}</p>
        <FallbackLinks />
      </div>
    );
  }

  if (phase.kind === 'likely') {
    return (
      <LikelyMatches
        phase={phase}
        messageRef={messageRef}
        onRemove={(slug) =>
          setPhase({ ...phase, likely: phase.likely.filter((match) => match.slug !== slug) })
        }
        onConfirm={() =>
          navigate(uniqueSlugs([...phase.confirmed, ...phase.likely]), phase.handoff)
        }
        onStartOver={startOver}
      />
    );
  }

  const hintId = problem ? `${ids.hint} ${ids.error}` : ids.hint;
  const fieldProps = {
    ref: fieldRef,
    'aria-describedby': hintId,
    'aria-invalid': problem ? true : undefined,
    onFocus: markStarted,
    disabled: busy,
  };
  const tabs = mode === 'jsonld-only' ? (['url'] as const) : INPUT_TYPES;

  return (
    <div className="flex flex-col gap-lg" data-tool-state={phase.kind}>
      {block.description ? <p className="text-paragraph">{block.description}</p> : null}
      {mode === 'jsonld-only' ? (
        <p className="text-paragraph text-fg-muted">{t.jsonldOnly}</p>
      ) : null}

      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-md">
        {tabs.length > 1 ? (
          <ToolTabs
            base={ids.base}
            tabs={tabs}
            active={activeTab}
            onChange={chooseTab}
            disabled={busy}
          />
        ) : null}

        <div
          id={`${ids.base}-panel`}
          role={tabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={tabs.length > 1 ? `${ids.base}-tab-${activeTab}` : undefined}
          className="flex flex-col gap-xs"
        >
          {activeTab === 'url' ? (
            <>
              <label htmlFor={`${ids.base}-url`} className="text-label font-semibold">
                {block.url_label}
              </label>
              <input
                {...fieldProps}
                id={`${ids.base}-url`}
                type="url"
                inputMode="url"
                autoComplete="off"
                maxLength={URL_MAX_LENGTH}
                placeholder={block.url_placeholder}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className={cn(inputClass, 'h-control rounded-pill py-0')}
              />
              <p id={ids.hint} className="text-fg-muted">
                {t.urlHint}
              </p>
            </>
          ) : null}

          {activeTab === 'image' ? (
            <>
              <label htmlFor={`${ids.base}-image`} className="text-label font-semibold">
                {block.upload_label}
              </label>
              <input
                {...fieldProps}
                id={`${ids.base}-image`}
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className={cn(
                  inputClass,
                  'file:mr-md file:h-control-compact file:rounded-pill file:border-0 file:bg-interactive file:px-md file:font-semibold file:text-on-interactive',
                )}
              />
              <p id={ids.hint} className="text-fg-muted">
                {file
                  ? format(t.fileChosen, { name: file.name })
                  : block.upload_placeholder || t.uploadHint}
              </p>
            </>
          ) : null}

          {activeTab === 'text' ? (
            <>
              <label htmlFor={`${ids.base}-text`} className="text-label font-semibold">
                {t.textLabel}
              </label>
              <textarea
                {...fieldProps}
                id={`${ids.base}-text`}
                rows={6}
                maxLength={TEXT_MAX_LENGTH}
                value={text}
                onChange={(event) => setText(event.target.value)}
                className={inputClass}
              />
              <p id={ids.hint} className="text-fg-muted">
                {t.textHint}
              </p>
            </>
          ) : null}

          {problem ? (
            <p id={ids.error} className="font-semibold text-semantic-tomato">
              {PROBLEM_COPY[problem]}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-sm">
          <Button type="submit" disabled={busy || phase.kind === 'rateLimited'}>
            {block.cta_label}
          </Button>
          {busy ? (
            <Button type="button" variant="tertiary" onClick={cancel}>
              {t.cancel}
            </Button>
          ) : null}
        </div>
      </form>

      <p role="status" className="text-paragraph">
        {phase.kind === 'loading' ? (phase.stillWorking ? t.stillWorking : t.submitting) : null}
      </p>

      {focusKey ? (
        <div
          ref={messageRef}
          tabIndex={-1}
          className="flex flex-col gap-md rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          <OutcomeMessage phase={phase} waitSeconds={waitSeconds} onRetry={() => void submit()} />
        </div>
      ) : null}
    </div>
  );
}

function OutcomeMessage({
  phase,
  waitSeconds,
  onRetry,
}: {
  phase: Phase;
  waitSeconds: number;
  onRetry: () => void;
}) {
  switch (phase.kind) {
    case 'noMatch':
      return (
        <>
          <p className="text-paragraph">{t.noMatch}</p>
          <FallbackLinks />
        </>
      );
    case 'unreadable':
      return <p className="text-paragraph">{t.unreadable}</p>;
    case 'rateLimited':
      return (
        <p className="text-paragraph">
          {t.rateLimited} {format(t.retryIn, { seconds: waitSeconds })}
        </p>
      );
    case 'error':
      return (
        <>
          <p className="text-paragraph">{ERROR_COPY[phase.reason]}</p>
          {phase.retryable ? (
            <Button type="button" variant="secondary" onClick={onRetry} className="self-start">
              {t.retry}
            </Button>
          ) : null}
        </>
      );
    default:
      return null;
  }
}

function ToolTabs({
  base,
  tabs,
  active,
  onChange,
  disabled,
}: {
  base: string;
  tabs: readonly InputType[];
  active: InputType;
  onChange: (tab: InputType) => void;
  disabled: boolean;
}) {
  const refs = useRef<Partial<Record<InputType, HTMLButtonElement | null>>>({});

  // Automatic activation with roving tabindex (WAI-ARIA tabs pattern).
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = tabs.indexOf(active);
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    onChange(tab);
    refs.current[tab]?.focus();
  }

  return (
    <div role="tablist" aria-label={t.tabsLabel} className="flex flex-wrap gap-xs">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            ref={(element) => {
              refs.current[tab] = element;
            }}
            id={`${base}-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${base}-panel`}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(tab)}
            onKeyDown={onKeyDown}
            className={cn(
              'h-control-compact rounded-pill border px-md text-label font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60',
              selected
                ? 'border-transparent bg-interactive text-on-interactive'
                : 'border-line text-fg',
            )}
          >
            {t.tabs[tab]}
          </button>
        );
      })}
    </div>
  );
}

function LikelyMatches({
  phase,
  messageRef,
  onRemove,
  onConfirm,
  onStartOver,
}: {
  phase: Extract<Phase, { kind: 'likely' }>;
  messageRef: RefObject<HTMLDivElement | null>;
  onRemove: (slug: string) => void;
  onConfirm: () => void;
  onStartOver: () => void;
}) {
  const total = phase.confirmed.length + phase.likely.length;
  return (
    <div className="flex flex-col gap-md" data-tool-state="likely">
      <div
        ref={messageRef}
        tabIndex={-1}
        className="rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        <p className="text-paragraph">{t.likely}</p>
      </div>
      <ul className="flex flex-wrap gap-xs">
        {phase.likely.map((match) => (
          <li
            key={match.slug}
            className="flex items-center gap-2xs rounded-pill border border-line py-2xs pr-2xs pl-md text-label"
          >
            {match.title}
            <button
              type="button"
              aria-label={format(t.remove, { title: match.title })}
              onClick={() => {
                onRemove(match.slug);
                messageRef.current?.focus();
              }}
              className="grid size-10 place-items-center rounded-pill hover:bg-interactive focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-sm">
        <Button type="button" onClick={onConfirm} disabled={total === 0}>
          {t.seeTips}
        </Button>
        <Button type="button" variant="tertiary" onClick={onStartOver}>
          {t.startOver}
        </Button>
      </div>
    </div>
  );
}

function FallbackLinks() {
  return (
    <div className="flex flex-wrap gap-sm">
      <Button asChild variant="secondary">
        <Link href="/tips/">{t.browseTips}</Link>
      </Button>
      <Button asChild variant="tertiary">
        <Link href={SEARCH_PATH}>{t.searchSite}</Link>
      </Button>
    </div>
  );
}
