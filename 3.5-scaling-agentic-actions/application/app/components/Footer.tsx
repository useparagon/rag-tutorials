import Image from "next/image";

export const Footer = () => {
    return (
        <div className="fixed bottom-0 left-0 py-4 flex h-auto w-full z-20 items-end justify-center bg-inherit
                        from-white via-white dark:from-black dark:via-black">
            <div className={""}>
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
            </div>
        </div>
    );
}
