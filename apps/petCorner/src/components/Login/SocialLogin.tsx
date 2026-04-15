// src/pages/Login/components/SocialLogin.tsx
type Props = {
  onGoogle: () => Promise<boolean>;
  onMicrosoft: () => Promise<boolean>;
};

export default function SocialLogin({ onGoogle, onMicrosoft }: Props) {
  return (
    <section className="social-login">
      <button
        type="button"
        className="social-button google"
        onClick={onGoogle}
        aria-label="Entrar com Google"
      >
        <i className="fa-brands fa-google" />
      </button>

      <button
        type="button"
        className="social-button microsoft"
        onClick={onMicrosoft}
        aria-label="Entrar com Microsoft"
      >
        <i className="fa-brands fa-windows" />
      </button>
    </section>
  );
}
