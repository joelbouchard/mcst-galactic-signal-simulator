import { GUIDE_HELP } from "../science/guideHelp";
import type { GuideTopic } from "../science/guideHelp";
import { ParameterHelp } from "./ParameterHelp";

export function GuideHelp({ topic }: { topic: GuideTopic }) {
  return <ParameterHelp content={GUIDE_HELP[topic]} />;
}
