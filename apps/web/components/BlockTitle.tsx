import { Typography } from './Typography';

export function BlockTitle(props: {
  title: {
    copy: string;
    header: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  };
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
