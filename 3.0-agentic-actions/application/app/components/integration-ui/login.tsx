import React, { useState } from "react";
import { AuthenticatedConnectUser, paragon } from "@useparagon/connect";

interface ChildProps {
  setUser: (user: AuthenticatedConnectUser) => void
}

const Login: React.FC<ChildProps> = (props) => {
  const [email, setEmail] = useState<string>("null");
  const [password,setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {id , value} = e.target;
    if(id === "email"){
      setEmail(value);
    }
    if(id === "password"){
      setPassword(value);
    }
  }

  const handleSubmit = async () => {
    const usr = {
      usernameOrEmail: email,
      password: password
    }
    fetch(process.env.NEXT_PUBLIC_AUTH_BACKEND ?? "", {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usr)
    }).then(function (data) {
      data.json().then((response) => {
        if (response.accessToken) {
          paragon.authenticate(process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID ?? "", response.accessToken);
          sessionStorage.setItem("jwt", response.accessToken);
          const usr = paragon.getUser();
          if(usr.authenticated){
            props.setUser(usr);
          }
        } else {
          setErrorMessage("Login Unsuccessful");
        }
      })
    }).catch(() => setErrorMessage("Login Unsuccessful"))
  };


  return(
    <div className="w-2/3 p-4 px-10 text-center flex flex-col space-y-2 bg-white shadow-2xl rounded-2xl">
        <h2 className="font-sans font-bold mb-2 text-lg">Log In</h2>
        <p className="mb-2 max-2-sm font-sans font-light text-gray-600">
          Log in to your account to access your Paragon integrations
        </p>
        <input type="email" id="email"
               className="h-1 w-full p-6 mb-2 border border-gray-300 rounded-md placeholder:font-sans placeholder:font-light"
               placeholder="Email" onChange={(e) => handleInputChange(e)}/>
        <input type="password" id="password"
               className="h-1 w-full p-6 mb-2 border border-gray-300 rounded-md placeholder:font-sans placeholder:font-light"
               placeholder="Password"
               onChange={(e) => handleInputChange(e)}/>
        {errorMessage !== "" && <div className="text-red-700 my-2"> {errorMessage} </div>}
          <button
            className="shrink h-1 flex justify-center items-center p-6 space-x-4 font-sans font-bold text-white rounded-md shadow-lg px-9 bg-cyan-700 shadow-cyan-100
                    hover:bg-opacity-90 shadow-sm hover:shadow-lg border transition hover:-translate-y-0.5 duration-150"
            onClick={() => handleSubmit()} type="submit">Login
          </button>
    </div>
  );
}
export default Login;