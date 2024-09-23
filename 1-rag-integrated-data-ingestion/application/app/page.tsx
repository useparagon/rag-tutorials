"use client";
import Header from "@/app/components/header";
import ChatSection from "./components/chat-section";
import { useState } from "react";
import Integrations from "@/app/components/integration-ui/integrations";

export default function Home() {
  const [intgDropdown, setIntgDropdown] = useState<boolean>(false);

  function toggleDropdown(){
    setIntgDropdown(!intgDropdown);
  }

  return (
    <main className="pt-10 flex justify-center items-center background-gradient">
      <div className="flex-col space-y-2 lg:space-y-10 w-[90%] lg:w-[60rem]">
        <Header toggle = {toggleDropdown}/>
        {intgDropdown && <Integrations/>}
        <div className="h-[65vh] flex">
          <ChatSection />
        </div>
      </div>
    </main>
  );
}
