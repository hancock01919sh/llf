import type { cmsType } from '@llf/contracts';
import { Typography } from './Typography';

export function BlockTitle(props: {
  title: cmsType.shared.TitleDeepRef;
  moduleIndex: number;
  className?: string;
}) {
  const { title, className, moduleIndex } = props;
  if (!title.copy) return null;
  let Tag = title.header;
  if (title.header === 'h1' && moduleIndex > 0) {
    Tag = 'h2';
  }
  return (
    <Typography variant="headline-lg" as={Tag} className={className}>
      {title.copy}
    </Typography>
  );
}
