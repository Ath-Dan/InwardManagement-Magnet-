// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskForm from './TaskForm';
import * as XLSX from 'xlsx';

function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const downloadExcel = () => {
    try {
      // Create a worksheet from tasks data
      const worksheet = XLSX.utils.json_to_sheet(tasks);

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

      // Generate an Excel file and trigger download
      XLSX.writeFile(workbook, 'tasks.xlsx');
    } catch (error) {
      console.error('Error generating Excel file:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
      <TaskForm onTaskCreated={handleTaskCreated} users={users} />
      <div className="mt-8  w-full">
        <h2 className="text-2xl font-bold mb-4">All Tasks</h2>
        <div className='w-full overflow-x-scroll'>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Inward No</th>
              <th className="py-2 px-4 border-b">Subject</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Assigned To</th>
              <th className="py-2 px-4 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.inwardNo}>
                <td className="py-2 px-4 border-b text-center">{task.inwardNo}</td>
                <td className="py-2 px-4 border-b text-center">{task.subject}</td>
                <td className="py-2 px-4 border-b text-center">{task.description}</td>
                <td className="py-2 px-4 border-b text-center">{task.assignedTo}</td>
                <td className="py-2 px-4 border-b text-center">{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between">
        <button
          onClick={handleLogout}
          className="mt-8 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
        <button
          onClick={downloadExcel}
          className="mt-8 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Download Excel
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
