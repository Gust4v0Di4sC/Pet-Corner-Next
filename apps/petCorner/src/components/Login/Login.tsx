import "./login.css";
import Logo from "../Templates/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import type {FormEvent} from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Animation from "../../assets/Animation.lottie";
import logoimg from "../../assets/logo.png"
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import { FirebaseError } from "firebase/app";


type AlertType = {
  severity: 'error' | 'success';
  message: string;
} | null;

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { login,loginWithGoogle,loginWithMicrosoft } = useAuth();
  const [alert, setAlert] = useState<AlertType>(null);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  

  if (email !== '' && password !== '') {
    try {
      await login(email, password);
      setAlert({ severity: 'success', message: 'Login realizado com sucesso!' });
      // redirecionar, por exemplo:
      // navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorMessage =
          error.code === "auth/user-not-found"
            ? "Usuário não encontrado"
            : error.code === "auth/wrong-password"
            ? "Senha incorreta"
            : "Erro ao fazer login";
        setAlert({ severity: "error", message: errorMessage });
      } else {
        setAlert({ severity: "error", message: "Erro ao fazer login" });
      }
    }
  } else  {
      setAlert({ severity: 'error', message: 'Preencha todos os campos' });
  }
};


  return (
    <div className="container paw-main">
      {alert && (
        <Box sx={{ width: "fit-content", mx: "auto", my: -5 }}>
          <Alert
            variant="filled"
            severity={alert.severity}
            onClose={() => setAlert(null)}
          >
            <AlertTitle>
              {alert.severity === "error" ? "Error" : "Success"}
            </AlertTitle>
            {alert.message}
          </Alert>
        </Box>
      )}
      <form className="form" onSubmit={handleSubmit}>
        <Logo src={logoimg} />
        <div className="box">
          <input
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Digite seu nome..."
            value={email}
          />
          <input
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Digite sua senha..."
            value={password}
          />
          <button className="btn-primary login-button"
            onMouseEnter={() => setShowAnimation(true)}
            onMouseLeave={() => setShowAnimation(false)}
            type="submit"
          >
            Entrar
          </button>
          <section className="social-login">
            <button type="button" className="social-button google" onClick={loginWithGoogle}>
              <i className="fa-brands fa-google"></i>
            </button>
            <button type="button" className="social-button microsoft" onClick={loginWithMicrosoft}>
              <i className="fa-brands fa-windows"></i>
            </button>
          </section>
        </div>
        
      </form>
      <div className="paws">
        {showAnimation && <DotLottieReact src={Animation} autoplay loop />}
      </div>
    </div>
  );
}
