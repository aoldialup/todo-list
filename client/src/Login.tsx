import { useRef, useState, useEffect, useContext } from 'react';
import AuthContext, { AuthProvider } from "./context/AuthProvider";
import { useNavigate, Link, Navigate } from 'react-router-dom';
import axios from './api/axios';
import Cookies from 'js-cookie';

function Login() {
  const { auth, url }: any = useContext(AuthContext);
  const userRef = useRef<any>();
  const errRef = useRef<any>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate(); 

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [username, password]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const response: any = await axios.post('/accounts/login',
        JSON.stringify({ username, password }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        },
      );

      Cookies.set('token', response.data.token, { expires: 1/24 });
      // const token = response?.data?.token;
      // setAuth(token);

      setUsername('');
      setPassword('');
      setSuccess(true);
      navigate('/todos', { replace: true });
    }
    catch (err: any) {
      console.log(err);
      if (!err?.response) {
        setErrMsg('No Server Response');
      } else if (err.response?.status === 400) {
        setErrMsg('Missing username or password');
      } else if (err.response?.status === 401) {
        setErrMsg("Invalid username or password")
      } else {
        setErrMsg('Login Failed');
      }
      errRef.current.focus();
    }
  }

  return (
    <>
      <section>
        <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
        <h1>Sign In</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            ref={userRef}
            autoComplete="off"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            required
          />

          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
          <button>Sign In</button>
        </form>
        <p>
          Need an Account?<br />
          <span className="line">
            <Link to="/register">Sign Up</Link>
          </span>
        </p>
      </section>

    </>
  )
}

export default Login;