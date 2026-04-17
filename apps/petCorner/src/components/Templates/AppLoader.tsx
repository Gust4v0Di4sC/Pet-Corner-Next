import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import Animation from "../../assets/Animation.lottie";
import "./app-loader.css";

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
        <DotLottieReact src={Animation} autoplay loop />
      </div>

      <p className="app-loader__message">{message}</p>
    </div>
  );
}
