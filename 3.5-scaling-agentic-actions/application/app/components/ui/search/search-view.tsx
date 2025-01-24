import {SearchResult} from "@/app/components/ui/search/types/search-result";
import SearchCard from "@/app/components/ui/search/search-card";
import {Loader2} from "lucide-react";
import {AuthenticatedConnectUser} from "@useparagon/connect";

export default function SearchView(props:{
    results: Array<SearchResult>,
    loading: boolean,
    user: {allowed: boolean}
}){
    const cards = props.results.map((result, index) => {
        return(
            <SearchCard key={index} searchResult={result}  user={props.user}/>
        );
    })
    return(
        <div >
            {props.loading ? <Loader2 className="w-full h-4 animate-spin" /> : cards}
        </div>
    );
}