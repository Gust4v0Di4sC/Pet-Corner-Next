
import "./App.css";
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
