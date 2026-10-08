'use client';

import { IngredientData, parseResultSlugs } from '@llf/contracts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Heading } from '@/components/Heading';
import { format, strings } from '@/content/strings';
import { track } from '@/lib/analytics';
import { takeHandoff } from '@/lib/find-tips';

type State =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; ingredients: IngredientData[] };

async function loadIngredient(slug: string): Promise<IngredientData | null> {
  try {
    const response = await fetch(`/data/ingredients/${slug}.json`);
    if (!response.ok) return null;
    return IngredientData.safeParse(await response.json()).data ?? null;
  } catch {
    return null;
  }
}

/**
 * Results for `?i=slug,slug` (TDD §6.1). Slugs are catalog keys, never user text. Unknown slugs are
 * dropped. When the visitor came from the tool, the handoff adds the partial-match note and the
 * `tips_tool_result` event; a shared link shows the same tips without either.
 * TODO(BD3244-8): the designed results layout, tip cards, and the Tip Modal.
 */
export function ResultsView() {
  const slugs = parseResultSlugs(useSearchParams().get('i'));
  const key = slugs.join(',');
  const [state, setState] = useState<State>({ status: 'loading' });
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    const handoff = takeHandoff();
    const wanted = key ? key.split(',') : [];
    void Promise.all(wanted.map(loadIngredient)).then((loaded) => {
      if (cancelled) return;
      const ingredients = loaded.filter((item): item is IngredientData => item !== null);
      if (wanted.length > 0 && ingredients.length === 0) {
        setState({ status: 'error' });
        return;
      }
      setState({ status: 'ready', ingredients });
      if (handoff) {
        setUnmatchedCount(handoff.unmatchedCount);
        track({
          event: 'tips_tool_result',
          input_type: handoff.inputType,
          source: handoff.source,
          ingredients_matched: ingredients.length,
          unmatched_count: handoff.unmatchedCount,
          tips_shown: ingredients.reduce((sum, item) => sum + item.tips.length, 0),
          latency_ms: Math.round(handoff.latencyMs),
          catalog_version: handoff.catalogVersion,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (state.status !== 'loading') headingRef.current?.focus();
  }, [state.status]);

  const startOver = (
    <Link
      href="/find-my-tips/"
      className="self-start rounded-pill bg-interactive px-md py-xs font-semibold text-on-interactive hover:bg-interactive-hover"
    >
      {strings.results.startOver}
    </Link>
  );

  if (state.status === 'loading') return <p role="status">{strings.results.loading}</p>;

  const ingredients = state.status === 'ready' ? state.ingredients : [];
  const tipCount = ingredients.reduce((sum, item) => sum + item.tips.length, 0);

  return (
    <>
      <header className="flex flex-col gap-sm">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-5xl uppercase focus:outline-none"
        >
          {strings.results.heading}
        </h1>
        {state.status === 'error' ? (
          <p role="alert">{strings.results.error}</p>
        ) : ingredients.length === 0 ? (
          <p>{strings.results.empty}</p>
        ) : (
          <p>
            {format(strings.results.count, { ingredients: ingredients.length, tips: tipCount })}
          </p>
        )}
        {unmatchedCount > 0 && ingredients.length > 0 ? (
          <p>
            {format(strings.tool.partial, {
              matched: ingredients.length,
              total: ingredients.length + unmatchedCount,
            })}
          </p>
        ) : null}
        {startOver}
      </header>
      {ingredients.map((ingredient) => (
        <section
          key={ingredient.slug}
          aria-labelledby={`ingredient-${ingredient.slug}`}
          className="flex flex-col gap-md"
        >
          <div className="flex flex-col gap-2xs">
            <Heading as="h2" id={`ingredient-${ingredient.slug}`} className="text-3xl">
              {format(strings.results.tipsFor, { title: ingredient.title })}
            </Heading>
            <p className="text-label">
              {format(strings.results.wasted, { level: ingredient.wasted })}
            </p>
          </div>
          {ingredient.tips.length === 0 ? (
            <p>{strings.results.noTips}</p>
          ) : (
            <ul className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
              {ingredient.tips.map((tip) => (
                <li
                  key={tip.documentId}
                  className="flex flex-col gap-xs rounded-sm border border-line p-md"
                >
                  {tip.type ? <p className="text-label uppercase">{tip.type}</p> : null}
                  <Heading as="h3" className="text-xl">
                    {tip.title}
                  </Heading>
                  {tip.description ? <p className="text-paragraph">{tip.description}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
