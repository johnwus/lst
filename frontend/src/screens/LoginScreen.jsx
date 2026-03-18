import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import {useState} from "react";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleLogin = async () => {
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json"},
            body: JSON.stringify({email, password})
        });

        const data = await response.json();

        if (response.ok){
            localStorage.setItem("token", data.token);
            console.log("Login successful");
        }
        else{
            console.log("Login failed");
        }
        navigate("/chat", { replace: true });
    };

    return (
        <AuthLayout
            title="Login"
            buttonLabel="Login"
            onButtonClick={handleLogin}
            footer={
                <>
                    New to Let'sTalk?{" "}
                    <Link to="/register" className="text-accent-purple">
                        Create an account
                    </Link>
                </>
            }
        >
                <input
                    placeholder="Email"
                    className="w-full mb-3 px-3 py-2 rounded-lg bg-midnight border border-midnight-border text-white outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    placeholder="Password"
                    type="password"
                    className="w-full mb-4 px-3 py-2 rounded-lg bg-midnight border border-midnight-border text-white outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
        </AuthLayout>
    );
}
