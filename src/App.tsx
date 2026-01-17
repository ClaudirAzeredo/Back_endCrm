import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import TaskList from "@/pages/TaskList";
import TaskForm from "@/pages/TaskForm";
import TaskDetails from "@/pages/TaskDetails";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tarefas" element={<TaskList />} />
        <Route path="/tarefas/nova" element={<TaskForm />} />
        <Route path="/tarefas/:id" element={<TaskDetails />} />
        <Route path="/tarefas/:id/editar" element={<TaskForm />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
