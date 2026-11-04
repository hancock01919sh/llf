import { DynamicZone } from '@/blocks/DynamicZone';
import type { TemplateProps } from './types';
import { Provider } from '@/components/Provider';
import { getPageProviderData } from '@/lib/cms';
const { navigation, footer, global } = await getPageProviderData();
export function PageTemplate({ page }: TemplateProps) {
  return (
    <>
      <Provider navigation={navigation} footer={footer} global={global}>
        <DynamicZone page={page} />
      </Provider>
    </>
  );
}
