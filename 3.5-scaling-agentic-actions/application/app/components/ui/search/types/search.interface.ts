

export interface SearchHandler {
    input: string;
    isLoading: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    setInput?: (input: string) => void;
    handleSubmit: (
        e: React.FormEvent<HTMLFormElement>,
        ops?: {
            data?: any;
        },
    ) => void;
}
