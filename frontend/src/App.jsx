import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import ReceiveStockModel19 from './pages/ReceiveStockModel19'
import IssueStockModel20 from './pages/IssueStockModel20'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/receive-stock" element={<ReceiveStockModel19 />} />
            <Route path="/issue-stock" element={<IssueStockModel20 />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
