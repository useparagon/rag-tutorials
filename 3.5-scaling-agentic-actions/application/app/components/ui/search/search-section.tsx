import React, {useEffect, useState} from "react";
import SearchInput from "@/app/components/ui/search/search-input";
import {SearchResult} from "@/app/components/ui/search/types/search-result";
import {useClientConfig} from "@/app/components/ui/chat/hooks/use-config";
import SearchView from "@/app/components/ui/search/search-view";
import {AuthenticatedConnectUser} from "@useparagon/connect";

interface ChildProps {
    user: {allowed: boolean},
}

export default function SearchSection(props: ChildProps) {
    const { backend } = useClientConfig();
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<Array<SearchResult>>([]);

    useEffect(() => {
        setLoading(false);
    }, [results]);

    async function handleSubmit(){
        setLoading(true);
        const res = await fetch(`${backend}/api/search`,{
            method: 'POST',
            body: JSON.stringify({searchTerm: input}),
            headers: {
                'content-type': 'application/json',
                "Authorization": "Bearer " + sessionStorage.getItem("jwt")
            }
        }).then((res) => res.json());
        console.log(res);
        setResults(res.nodes);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>){
        setInput(e.target.value);
    }

    return (
        <div className="space-y-4 w-full h-full flex flex-col">
            <SearchInput
                handleSubmit={handleSubmit}
                input={input}
                isLoading={loading}
                handleInputChange={handleInputChange}>
            </SearchInput>
            <SearchView results={results} loading={loading} user={props.user}></SearchView>
        </div>
    )
};