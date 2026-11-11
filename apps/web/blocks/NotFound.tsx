import TransitionLink from '@/components/TransitionLink';
import { Typography } from '@/components/Typography';
export function BlockNotFound(props: {
  title: string;
  description: string;
  backgroundColor: string;
  cta: string;
}) {
  return (
    <section
      className="aspect-402/762 lg:aspect-1440/951 px-5 lg:px-0 mx-auto lg:max-w-page flex-center flex-col justify-center gap-6.25"
    >
      <Typography variant="subhead-lg">{props.description}</Typography>
      <Typography as="h1" variant="headline-lg" className="text-center">
        {props.title}
      </Typography>
      <TransitionLink href={'/'} className="btn mt-5">
        {props.cta}
      </TransitionLink>
    </section>
  );
}
