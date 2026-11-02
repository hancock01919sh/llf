'use client';
import { useState } from 'react';
import type { BlockProps } from '../types';
import { IngredientsHeader } from '@/blocks/CategoryDetail.tsx/IngredientsHeader';
import { IngredientsList } from '@/blocks/CategoryDetail.tsx/IngredientsList';
import type { SearchBlockProps } from '.';
export function SearchBlock(props: BlockProps<SearchBlockProps>) {
  const [ingredients] = useState([]);
  async function searchIngredients(query: string) {
    if (!query) return;
    // const ingredients = await fetch(`/data/ingredient?query=${query}`).then((res) => res.json());
    // setIngredients([]);
  }
  return (
    <>
      <IngredientsHeader {...props.block} Background_color={'paper'} onSearch={searchIngredients} />
      <IngredientsList {...props.block} Background_color={'paper'} ingredients={ingredients} />
    </>
  );
}
