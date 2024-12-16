import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

function UserDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL);
    fetchTasks();

    socket.on('newTask', (task) => {
      if (task.assignedTo === localStorage.getItem('userEmail')) {
        setTasks((prevTasks) => (Array.isArray(prevTasks) ? [...prevTasks, task] : [task]));
      }
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prevTasks) =>
        Array.isArray(prevTasks)
          ? prevTasks.map((task) => (task.inwardNo === updatedTask.inwardNo ? updatedTask : task))
          : []
      );
    });

    return () => {
      socket.off('newTask');
      socket.off('taskUpdated');
      socket.disconnect();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/tasks/user`, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });

      if (Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        console.error('Unexpected tasks data:', response.data);
        setTasks([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again later.');
      setLoading(false);
    }
  };

  const handleTaskAction = async (inwardNo, action) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/tasks/${inwardNo}/${action}`, {}, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  };

  if (loading) return <div className="text-center mt-8">Loading tasks...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
        {Array.isArray(tasks) && tasks.length === 0 ? (
          <p>No tasks assigned to you yet.</p>
        ) : (
          <div className='w-full overflow-x-scroll'>
            <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Inward No</th>
                <th className="py-2 px-4 border-b">Subject</th>
                <th className="py-2 px-4 border-b">Description</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(tasks) &&
                tasks.map((task) => (
                  <tr key={task.inwardNo}>
                    <td className="py-2 px-4 border-b text-center">{task.inwardNo}</td>
                    <td className="py-2 px-4 border-b text-center">{task.subject}</td>
                    <td className="py-2 px-4 border-b text-center">{task.description}</td>
                    <td className="py-2 px-4 border-b text-center">{task.status}</td>
                    <td className="py-2 px-4 border-b text-center">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleTaskAction(task.inwardNo, 'accept')}
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
                        >
                          Accept
                        </button>
                      )}
                      {task.status === 'In progess' && (
                        <>
                          <button
                            onClick={() => handleTaskAction(task.inwardNo, 'complete')}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleTaskAction(task.inwardNo, 'fail')}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                          >
                            Fail
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="mt-8 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Logout
      </button>
    </div>
  );
}

export default UserDashboard;
