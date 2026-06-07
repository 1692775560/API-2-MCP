import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const commands = [
  {
    start: 28,
    prompt: "$",
    text: "npm install -g @taozhang123/api-to-mcp",
    output: ["added 2 packages in 4s"],
  },
  {
    start: 82,
    prompt: "$",
    text: "api-to-mcp generate ./openapi.json --out ./petstore-mcp",
    output: ["Generated MCP server at ./petstore-mcp"],
  },
  {
    start: 142,
    prompt: "$",
    text: "cd petstore-mcp && npm install && npm run build",
    output: ["> tsc", "build completed"],
  },
  {
    start: 198,
    prompt: "$",
    text: "npm start",
    output: ["MCP stdio server ready", "tools/list -> list_pets, create_pet"],
  },
];

const features = ["OpenAPI 3.x", "TypeScript", "MCP stdio", "Claude Code", "Codex"];

export const TerminalDemo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const terminalEnter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 34,
  });
  const flowProgress = interpolate(frame, [130, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={styles.stage}>
      <Grid />
      <div
        style={{
          ...styles.hero,
          opacity: interpolate(frame, [0, 24], [0, 1], {
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(terminalEnter, [0, 1], [36, 0])}px) scale(${interpolate(
            terminalEnter,
            [0, 1],
            [0.97, 1],
          )})`,
        }}
      >
        <Terminal frame={frame} />
      </div>
      <FlowPanel progress={flowProgress} frame={frame} />
      <div style={styles.titleBlock}>
        <div style={styles.kicker}>API-2-MCP</div>
        <div style={styles.title}>OpenAPI to agent-ready tools</div>
      </div>
      <div style={styles.footer}>
        {features.map((feature, index) => {
          const opacity = interpolate(frame, [40 + index * 8, 58 + index * 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={feature} style={{ ...styles.pill, opacity }}>
              {feature}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Terminal = ({ frame }: { frame: number }) => {
  return (
    <div style={styles.terminal}>
      <div style={styles.chrome}>
        <div style={{ ...styles.dot, background: "#ff5f57" }} />
        <div style={{ ...styles.dot, background: "#febc2e" }} />
        <div style={{ ...styles.dot, background: "#28c840" }} />
        <div style={styles.tabTitle}>api-to-mcp - demo</div>
      </div>
      <div style={styles.termBody}>
        <div style={styles.logoLine}>
          <span style={styles.logoMark}>{"{ }"}</span>
          <span>Generate MCP servers from OpenAPI specs</span>
        </div>
        {commands.map((command) => (
          <CommandBlock key={command.text} frame={frame} {...command} />
        ))}
      </div>
    </div>
  );
};

const CommandBlock = ({
  frame,
  start,
  prompt,
  text,
  output,
}: {
  frame: number;
  start: number;
  prompt: string;
  text: string;
  output: string[];
}) => {
  const chars = Math.max(0, Math.min(text.length, Math.floor((frame - start) / 1.25)));
  const commandDone = chars >= text.length;
  const blockOpacity = interpolate(frame, [start - 8, start], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorOn = Math.floor(frame / 12) % 2 === 0;

  return (
    <div style={{ ...styles.commandBlock, opacity: blockOpacity }}>
      <div style={styles.commandLine}>
        <span style={styles.prompt}>{prompt}</span>
        <span>{text.slice(0, chars)}</span>
        {!commandDone && cursorOn ? <span style={styles.cursor} /> : null}
      </div>
      {output.map((line, index) => {
        const outputOpacity = interpolate(
          frame,
          [start + text.length * 1.25 + index * 8, start + text.length * 1.25 + 10 + index * 8],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div key={line} style={{ ...styles.output, opacity: outputOpacity }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};

const FlowPanel = ({ progress, frame }: { progress: number; frame: number }) => {
  const panelOpacity = interpolate(frame, [112, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const arrowWidth = `${Math.round(progress * 100)}%`;

  return (
    <div style={{ ...styles.flowPanel, opacity: panelOpacity }}>
      <FlowCard label="openapi.json" accent="#16d9ff" sublabel="Spec" />
      <div style={styles.connector}>
        <div style={{ ...styles.connectorFill, width: arrowWidth }} />
      </div>
      <FlowCard label="MCP Server" accent="#67f06f" sublabel="Tools + schemas" />
      <div style={styles.connector}>
        <div style={{ ...styles.connectorFill, width: arrowWidth }} />
      </div>
      <FlowCard label="AI Clients" accent="#ffb86b" sublabel="Claude + Codex" />
    </div>
  );
};

const FlowCard = ({
  label,
  sublabel,
  accent,
}: {
  label: string;
  sublabel: string;
  accent: string;
}) => {
  return (
    <div style={{ ...styles.flowCard, borderColor: accent }}>
      <div style={{ ...styles.cardIcon, color: accent }}>◆</div>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardSublabel}>{sublabel}</div>
    </div>
  );
};

const Grid = () => {
  return <div style={styles.grid} />;
};

const styles: Record<string, React.CSSProperties> = {
  stage: {
    background:
      "radial-gradient(circle at 70% 18%, rgba(28, 220, 255, 0.16), transparent 32%), #07111f",
    color: "#f6fbff",
    fontFamily:
      "Inter, SF Pro Display, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(80, 200, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(80, 200, 255, 0.08) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
    opacity: 0.7,
  },
  titleBlock: {
    position: "absolute",
    left: 110,
    top: 72,
  },
  kicker: {
    color: "#20d8ff",
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: 0,
    marginBottom: 10,
  },
  title: {
    fontSize: 54,
    fontWeight: 800,
    letterSpacing: 0,
  },
  hero: {
    position: "absolute",
    left: 110,
    top: 188,
    width: 1040,
    height: 620,
  },
  terminal: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    overflow: "hidden",
    background: "rgba(4, 9, 17, 0.94)",
    border: "1px solid rgba(112, 214, 255, 0.32)",
    boxShadow: "0 30px 90px rgba(0, 0, 0, 0.45), 0 0 48px rgba(28, 218, 255, 0.18)",
  },
  chrome: {
    height: 58,
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: 12,
    background: "linear-gradient(180deg, rgba(38, 49, 67, 0.92), rgba(17, 26, 41, 0.92))",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
  },
  tabTitle: {
    marginLeft: 20,
    color: "#c8d4e3",
    fontSize: 22,
    fontWeight: 600,
  },
  termBody: {
    padding: "32px 38px",
    fontFamily: "SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 25,
    lineHeight: 1.56,
  },
  logoLine: {
    display: "flex",
    gap: 16,
    color: "#a9bed5",
    marginBottom: 28,
  },
  logoMark: {
    color: "#20d8ff",
    fontWeight: 800,
  },
  commandBlock: {
    marginBottom: 20,
  },
  commandLine: {
    color: "#f7fbff",
    whiteSpace: "pre",
  },
  prompt: {
    color: "#67f06f",
    marginRight: 12,
    fontWeight: 800,
  },
  cursor: {
    display: "inline-block",
    width: 12,
    height: 28,
    marginLeft: 4,
    background: "#20d8ff",
    transform: "translateY(5px)",
  },
  output: {
    color: "#7fe8ff",
    paddingLeft: 30,
  },
  flowPanel: {
    position: "absolute",
    left: 1190,
    top: 252,
    width: 600,
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  flowCard: {
    width: 520,
    height: 126,
    borderRadius: 16,
    border: "2px solid",
    background: "rgba(4, 15, 25, 0.86)",
    display: "grid",
    gridTemplateColumns: "74px 1fr",
    gridTemplateRows: "1fr 1fr",
    alignItems: "center",
    padding: "18px 24px",
    boxShadow: "0 20px 70px rgba(0, 0, 0, 0.28)",
  },
  cardIcon: {
    gridRow: "1 / span 2",
    fontSize: 34,
  },
  cardLabel: {
    fontSize: 31,
    fontWeight: 800,
  },
  cardSublabel: {
    color: "#a9bed5",
    fontSize: 22,
  },
  connector: {
    marginLeft: 58,
    width: 404,
    height: 7,
    borderRadius: 10,
    background: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  connectorFill: {
    height: "100%",
    background: "linear-gradient(90deg, #20d8ff, #67f06f)",
  },
  footer: {
    position: "absolute",
    left: 110,
    right: 110,
    bottom: 68,
    height: 72,
    display: "flex",
    alignItems: "center",
    gap: 22,
  },
  pill: {
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.07)",
    padding: "16px 24px",
    borderRadius: 999,
    color: "#dce9f6",
    fontSize: 24,
    fontWeight: 700,
  },
};
