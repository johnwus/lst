import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { useState } from "react";

export default function LoginScreen() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleLogin = (event) => {
        event?.preventDefault();
        localStorage.setItem("token", "demo-token");
        localStorage.setItem("user", formData.email || "christ_user");
        navigate("/chat", { replace: true });
    };

    return (
        <AuthLayout
            title="Sign in to Let&apos;s Talk"
            eyebrow="Welcome back"
            mobileDescription="Pick up where you left off, jump into the global room, and keep your threads moving from the same account."
            buttonLabel="Enter workspace"
            buttonType="submit"
            onSubmit={handleLogin}
            footer={
                <>
                    New to Let&apos;s Talk?{" "}
                    <Link to="/register" className="font-semibold text-accent-teal">
                        Create an account
                    </Link>
                </>
            }
        >
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">
                    Email
                </span>
                <input
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(event) =>
                        setFormData((prev) => ({
                            ...prev,
                            email: event.target.value,
                        }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#0d2029]/90 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent-teal"
                />
            </label>

            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">
                    Password
                </span>
                <input
                    placeholder="Enter your password"
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                        setFormData((prev) => ({
                            ...prev,
                            password: event.target.value,
                        }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#0d2029]/90 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent-purple"
                />
            </label>
        </AuthLayout>
    );
}
