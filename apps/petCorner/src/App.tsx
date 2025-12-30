
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import RoutesApp from "./Routes";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter basename="/app-react">
      <RoutesApp />
    </BrowserRouter>
  );
}

export default App;
