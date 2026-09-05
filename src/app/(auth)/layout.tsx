import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Brand className="text-primary-foreground [&_span]:text-primary-foreground" />
        <div>
          <h2 className="font-display text-3xl font-bold">Build Your Career. Forge Your Future.</h2>
          <p className="mt-3 max-w-md text-primary-foreground/80">
            AI-powered CVs, online courses, verifiable certificates and career guidance — all in one place.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} Career Forge
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
