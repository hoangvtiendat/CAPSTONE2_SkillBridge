import { SkillPage } from "../../components/skill/SkillPage";

import './authForm.css';
import Hero from '../../components/home/Hero';
const SkillPageContainer = () => {
    return (
        <div className="home-page">

            <div className="home-container">
                <main className="card-main">
                    <SkillPage />
                </main>
            </div>
        </div>


    );
}


export default SkillPageContainer;