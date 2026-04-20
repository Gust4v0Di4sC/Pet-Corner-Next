import { lazy, Suspense } from "react";

import animationUrl from "../../assets/Animation.lottie?url&no-inline";
import "./app-loader.css";

const DotLottieReact = lazy(async () => {
  const module = await import("@lottiefiles/dotlottie-react");
  return { default: module.DotLottieReact };
});

type Props = {
  message?: string;
  className?: string;
  fullscreen?: boolean;
  compact?: boolean;
};

export default function AppLoader({
  message = "Carregando...",
  className = "",
  fullscreen = false,
  compact = false,
}: Props) {
  const loaderClassName = [
    "app-loader",
    fullscreen ? "app-loader--fullscreen" : "",
    compact ? "app-loader--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={loaderClassName} role="status" aria-live="polite">
      <div className="app-loader__animation" aria-hidden="true">
        <Suspense fallback={null}>
          <DotLottieReact src={animationUrl} autoplay loop />
        </Suspense>
      </div>

      <p className="app-loader__message">{message}</p>
    </div>
  );
}
