import Navbar from "./Navbar";

interface PageShellProps {
    children: React.ReactNode;
    className?: string;
}

export default function PageShell({
    children,
    className = "",
}: PageShellProps) {
    return (
        <div className="min-h-screen">
            <Navbar />

            <main
                className={`mx-auto w-full max-w-[1280px] px-5 py-8 lg:px-8 lg:py-10 ${className}`}
            >
                {children}
            </main>
        </div>
    );
}