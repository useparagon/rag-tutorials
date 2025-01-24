"use client";
import {useState} from "react";
import {AuthenticatedConnectUser} from "@useparagon/connect";
import Header from "@/app/components/header";
import Integrations from "@/app/components/ui/integration/integrations";
import SearchInput from "@/app/components/ui/search/search-input";
import SearchSection from "@/app/components/ui/search/search-section";

export default function Parasearch() {
    const [intgDropdown, setIntgDropdown] = useState<boolean>(false);
    const [user, setUser] = useState<{ allowed: boolean; email: string; }>({allowed: false, email:""});

    function toggleDropdown(){
        setIntgDropdown(!intgDropdown);
    }

    return (
        <main className="pt-10 flex justify-center items-center background-gradient">
            <div className="flex-col space-y-2 lg:space-y-10 w-[90%] lg:w-[60rem]">
                <Header toggle = {toggleDropdown} toggleDown={intgDropdown} email={user.email}/>
                {intgDropdown && <Integrations user={user} />}
                <div className="flex">
                    <SearchSection user={user}>
                    </SearchSection>
                </div>
            </div>
        </main>
    );
}