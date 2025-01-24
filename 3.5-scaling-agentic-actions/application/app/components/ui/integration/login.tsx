import React from "react";
import {SignInWithGithub, SignInWithGoogle} from "@/app/components/ui/integration/auth-action";
import Image from "next/image";


const Login= () => {
  return (
      <div className={"flex space-x-4"}>
          <button onClick={() => SignInWithGoogle()}
                  className="p-2 px-4 text-center flex bg-gray-200 shadow-2xl rounded-2xl items-center space-x-2 font-['Helvetica']">
              <Image
                  className="rounded-xl"
                  src="/google-icon.png"
                  alt="Google Logo"
                  width={40}
                  height={40}
                  priority
              />
              <div>Sign in with Google</div>
          </button>
            <button onClick={() => SignInWithGithub()}
                    className="p-2 px-4 text-center flex bg-gray-200 shadow-2xl rounded-2xl items-center space-x-2 font-['Helvetica']">
                <Image
                    className="rounded-xl"
                    src="/github-logo.png"
                    alt="Github Logo"
                    width={40}
                    height={40}
                    priority
                />
                <div>Sign in with Github</div>
            </button>
      </div>
)
    ;
}
export default Login;