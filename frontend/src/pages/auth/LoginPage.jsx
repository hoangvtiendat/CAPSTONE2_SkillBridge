import { LoginForm } from "../../components/auth/LoginForm";

import './authForm.css';
const LoginPage = () => {
    return (
        <div className="home-page">

            <div className="home-container">
                <main className="card-main">
                    <LoginForm />
                </main>
            </div>
        </div>


    );
}


export default LoginPage;