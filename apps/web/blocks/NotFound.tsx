import { Typography } from "@/components/Typography";
import type { BlockProps } from "./types";
import type { cmsType } from "@llf/contracts";

export function NotFound(props:BlockProps<cmsType.component._404>) {
  return (
    <div className="aspect-402/762 lg:aspect-1440/951 flex-center flex-col justify-center gap-6.25">
      <Typography variant="subhead-lg">{props.block.Description}</Typography>
      <Typography variant="headline-lg" className="text-center">
        {props.block.Title}
      </Typography>
    </div>
  );
}
