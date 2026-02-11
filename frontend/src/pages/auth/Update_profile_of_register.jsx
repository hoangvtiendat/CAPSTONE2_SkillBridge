import Header from '../../components/home/Header';
import { UpdateDetail } from "../../components/auth/update_detail";
import './authForm.css';
const UpdateProfileDetail = () => {
    return(
    <div className="home-page">
        <Header />
        <div className="home-container">
        <main className="card-main">
            <UpdateDetail />
        </main>
        </div>
    </div>
    );
}

export default UpdateProfileDetail;