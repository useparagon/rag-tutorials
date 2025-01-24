import React from "react";
import {Textarea} from "@/app/components/ui/textarea";
import {Button} from "@/app/components/ui/button";
import {SearchHandler} from "@/app/components/ui/search/types/search.interface";

export default function SearchInput(props: SearchHandler){
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        props.handleSubmit(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
        }
    };

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-xl bg-white p-4 shadow-xl space-y-4 shrink-0"
        >
            <div className="flex w-full items-start justify-between gap-4 ">
                <Textarea
                    id="search-input"
                    autoFocus
                    name="message"
                    placeholder="Search to get started"
                    className="flex-1 min-h-0 h-[40px]"
                    value={props.input}
                    onChange={props.handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <Button type="submit" disabled={props.isLoading || !props.input.trim()}>
                    Search
                </Button>
            </div>
        </form>
    );
};