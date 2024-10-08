"use client";
import Header from "@/app/components/header";
import ChatSection from "./components/chat-section";
import { useState } from "react";
import Integrations from "@/app/components/integration-ui/integrations";
import {AuthenticatedConnectUser} from "@useparagon/connect";

export default function Home() {
    const [intgDropdown, setIntgDropdown] = useState<boolean>(false);
    const [user, setUser] = useState<AuthenticatedConnectUser | null>(null);

    function toggleDropdown(){
        setIntgDropdown(!intgDropdown);
    }

    return (
        <main className="pt-10 flex justify-center items-center background-gradient">
            <div className="flex-col space-y-2 lg:space-y-10 w-[90%] lg:w-[60rem]">
                <Header toggle = {toggleDropdown}/>
                {intgDropdown && <Integrations user={user} setUser={setUser}/>}
                <div className="h-[65vh] flex">
                    <ChatSection user={user} />
                </div>
            </div>
        </main>
    );
}
