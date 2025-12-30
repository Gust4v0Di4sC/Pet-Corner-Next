
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import RoutesApp from './Routes'
import {BrowserRouter} from 'react-router-dom'
import { AuthProvider } from '../src/contexts/AuthContext'

function App() {
  
  return (
     <BrowserRouter basename="/app-react">
        <AuthProvider>
          <RoutesApp />
        </AuthProvider>
      </BrowserRouter>
  )
}

export default App
