import { Composition } from "remotion";
import { TerminalDemo } from "./TerminalDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="TerminalDemo"
      component={TerminalDemo}
      durationInFrames={270}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
