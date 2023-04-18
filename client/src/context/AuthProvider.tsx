import { createContext, useState } from "react";
// import "dotenv/config.js";
//require('dotenv').config({path: '../../env'})
const AuthContext = createContext({});




export const AuthProvider = ({ children }: any) => {
  const [auth, setAuth] = useState('');
  const [url, setUrl] = useState(
    "http://localhost:3000"
    //process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL
  );
  return (
    <AuthContext.Provider value={{ auth, setAuth, url }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext;