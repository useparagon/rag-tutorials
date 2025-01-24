"use client";
import React from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface ChildProps {
    toggleDown: boolean,
    toggle: () => void,
    email: string
}
const Header: React.FC<ChildProps> = (props) => {

    return (
        <div className={props.email ? "h-16 absolute top-0 left-0 z-10 w-screen bg-stone-50 items-center flex-row-reverse justify-between font-['Helvetica'] text-sm flex" :
            "place-self-center z-10 w-3/4 items-center flex-row-reverse justify-between font-['Helvetica'] text-sm flex"}>
            {props.email &&
                <div className={"flex flex-col space-y-2"}>
                    <button className={"flex space-x-2 px-8 py-2 items-center justify-center " +
                        "font-bold text-indigo-600 hover:text-indigo-300"}
                        onClick={() => signOut()}>
                        Sign Out
                    </button>
                </div>}
            {props.email &&
                <a
                    href="https://www.useparagon.com/"
                    target="_blank"
                    className="px-8 flex items-center justify-center font-nunito text-lg font-bold gap-2"
                >
                    <Image
                        className="rounded-xl"
                        src="/paragon-logo.png"
                        alt="Paragon Logo"
                        width={30}
                        height={30}
                        priority
                    />
                    <span>Parato</span>
                </a>
            }

            {!props.email &&
                <a
                    href="https://www.useparagon.com/"
                    target="_blank"
                    className="flex items-center justify-center font-nunito text-lg font-bold gap-2"
                >
                    <Image
                        className="rounded-xl"
                        src="/paragon-logo.png"
                        alt="Paragon Logo"
                        width={40}
                        height={40}
                        priority
                    />
                    <span>Built with Paragon & LlamaIndex</span>
                    <Image
                        className="rounded-xl"
                        src="/llama.png"
                        alt="Llama Logo"
                        width={40}
                        height={40}
                        priority
                    />
                </a>
            }
            {!props.email && <button onClick={props.toggle}
                className={"flex justify-center " +
                    "dark:border-neutral-800 " +
                    "dark:bg-zinc-800/30 dark:from-inherit md:static w-48  rounded-xl " +
                    "bg-gray-200 p-4 dark:bg-zinc-800/30 " +
                    "border-4 border-indigo-600 font-bold text-base"}>
                <div className={props.toggleDown ? "text-amber-800" : ""}>
                    {props.toggleDown ? "Close Login Panel" : "Login"}
                </div>
            </button>
            }

        </div>
    );
}
export default Header;


