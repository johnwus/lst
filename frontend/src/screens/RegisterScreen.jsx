import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";

export default function RegisterScreen() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    const handleChange = ({ target: { name, value } }) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRegister = (event) => {
        event.preventDefault();

        if (!formData.fullName || !formData.email || !formData.password) {
            setError("Please complete all fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        localStorage.setItem("token", "demo-token");
        localStorage.setItem("user", formData.fullName);
        navigate("/chat", { replace: true });
    };

    return (
        <AuthLayout
            title="Create your Let&apos;s Talk profile"
            eyebrow="Create account"
            mobileDescription="Set up your profile once, then move between live chat and mini threads with the same conversation tools on mobile and desktop."
            buttonLabel="Create account"
            buttonType="submit"
            onSubmit={handleRegister}
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-accent-teal">
                        Login
                    </Link>
                </>
            }
        >
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">
                    Full name
                </span>
                <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Christ Doe"
                    className="w-full rounded-2xl border border-white/10 bg-[#0d2029]/90 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent-teal"
                />
            </label>

            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">
                    Email
                </span>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="christ@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-[#0d2029]/90 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent-teal"
                />
            </label>

            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">
                    Password
                </span>
                <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="w-full rounded-2xl border border-white/10 bg-[#0d2029]/90 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent-purple"
                />
            </label>

            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">
                    Confirm password
                </span>
                <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className="w-full rounded-2xl border border-white/10 bg-[#0d2029]/90 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent-purple"
                />
            </label>

            {error ? (
                <p className="rounded-2xl border border-[#ff5d73]/30 bg-[#ff5d73]/10 px-4 py-3 text-sm text-[#ff98a7]">
                    {error}
                </p>
            ) : null}
        </AuthLayout>
    );
}
