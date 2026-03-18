import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";

export default function RegisterScreen() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // const [formData, setFormData] = useState({
    //     fullName: "",
    //     email: "",
    //     password: "",
    //     confirmPassword: "",
    // });
    const [error, setError] = useState("");

    // const handleChange = ({ target: { name, value } }) => {
    //     setFormData((prev) => ({
    //         ...prev,
    //         [name]: value,
    //     }));
    // };

    const handleRegister = async (event) => {
        event.preventDefault();

        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify({username, email, password}),
        })

        const data = await response.json();

        if (response.ok){
            console.log("Register successful", data);
        }
        else{
            console.log("Registering failed");
        }
        if (!username || !email || !password) {
            setError("Please complete all fields.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        navigate("/chat", { replace: true });
    };

    return (
        <AuthLayout
            title="Register"
            buttonLabel="Register"
            buttonType="submit"
            onSubmit={handleRegister}
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" className="text-accent-purple">
                        Login
                    </Link>
                </>
            }
        >
                    <input
                        name="fullName"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Full name"
                        className="w-full mb-3 px-3 py-2 rounded-lg bg-midnight border border-midnight-border text-white outline-none"
                    />

                    <input
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full mb-3 px-3 py-2 rounded-lg bg-midnight border border-midnight-border text-white outline-none"
                    />

                    <input
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full mb-3 px-3 py-2 rounded-lg bg-midnight border border-midnight-border text-white outline-none"
                    />

                    <input
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full mb-4 px-3 py-2 rounded-lg bg-midnight border border-midnight-border text-white outline-none"
                    />

                    {error ? (
                        <p className="mb-4 text-sm text-accent-red">{error}</p>
                    ) : null}
        </AuthLayout>
    );
}
