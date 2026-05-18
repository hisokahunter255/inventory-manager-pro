import { useState, type FormEvent, type ReactNode } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PASSWORD = "MM@20304050";
const STORAGE_KEY = "inv_unlocked_until";
const SESSION_MS = 1000 * 60 * 60 * 8; // 8 hours

function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const v = localStorage.getItem(STORAGE_KEY);
  if (!v) return false;
  return Number(v) > Date.now();
}

export function PasswordGate({ title, children }: { title: string; children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(isUnlocked());
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, String(Date.now() + SESSION_MS));
      setUnlocked(true);
      setError("");
      setValue("");
    } else {
      setError("كلمة السر غير صحيحة");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">هذا القسم محمي بكلمة سر</p>
        </div>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="أدخل كلمة السر"
            className="h-12 pr-12 text-base"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="mt-6 h-12 w-full text-base font-semibold">
          فتح القسم
        </Button>
      </form>
    </div>
  );
}
