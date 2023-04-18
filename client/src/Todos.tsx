import { useEffect, useState, useContext } from "react";
import { v4 } from 'uuid';
import AuthContext from "./context/AuthProvider";
import Cookies from 'js-cookie';
import { modifiedFetch } from "./api/http";
import { useNavigate } from "react-router-dom";

type Todo = {
  name: string,
  id: string,
  dbId: number
};

export default function Todos() {
  const navigate = useNavigate();
  const { auth, url }: any = useContext(AuthContext);

  // if(!Cookies.get('token')) {
  //   navigate('/login');
  // }

  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    (async function fetchTodos() {
      try {
        const response = await modifiedFetch(`${url}/todos`, {
          method: 'get',
          mode: 'cors',
        });

        const data = await response.json();

        setTodos(data.result.map((x: any) => {
          return { name: x.text, id: v4(), dbId: x.todo_id }
        }));
      }
      catch (error) {
        // Show error box
      }
    })();
  }, []);

  async function deleteTodo(todo: Todo) {
    try {
      const response = await modifiedFetch(`${url}/todos/${todo.dbId}`, {
        method: 'delete',
        mode: 'cors'
      });

      setTodos(todos => todos.filter(entry => entry.dbId !== todo.dbId));
    }
    catch (error) {
      // Scroll to the top and show an error box
    }

  }

  async function modifyTodo(value: string, todoId: string, dbId: number) {
    try {
      const response = await modifiedFetch(`${url}/todos/${dbId}`, {
        method: 'put',
        mode: 'cors',
        body: JSON.stringify({ text: value })
      });

      setTodos(todos.map(todo => {
        if (todo.id === todoId) {
          return { ...todo, name: value };
        }

        return todo;
      }));
    }
    catch (error) {
      // Scroll to the top and show an error box
    }
  }

  async function addNewTodo() {
    try {
      const response = await modifiedFetch(`${url}/todos`, {
        method: 'post',
        mode: 'cors'
      });

      const data = await response.json();

      if (!data.todoId) {
        throw new Error("shit");
      }

      setTodos([...todos, { id: v4(), name: '', dbId: data.todoId }]);
    }
    catch (error) {
      // Scroll to the top and show an error box
    }
  }

  function logout() {
    Cookies.remove('token');
    navigate('/login', { replace: true })
  }

  return (
    <>
      <span><h1>Todo List</h1> <button className="btn btn-danger" onClick={() => logout()}>Logout</button></span>
      {todos.length > 0 &&
        <table className='table responsive'>
          <thead>
            <tr>
              <th scope='col'>Name</th>
              <th scope='col'>Delete</th>
            </tr>
          </thead>
          <tbody>
            {todos.map(todo => {
              return (
                <tr key={todo.id}>
                  <td><textarea className="form-control" value={todo.name} id={todo.id} onChange={async (e) => await modifyTodo(e.target.value, todo.id, todo.dbId)} /></td>
                  <td><button className="btn btn-danger" onClick={async () => await deleteTodo(todo)}>Delete</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      }
      <button className="btn btn-primary" onClick={async () => await addNewTodo()}>Add new</button>
      <br />
    </>
  );
}