import JdList from "../../components/JD/JdList";
import useCompanyDeactivationCheck from '../../hooks/useCompanyDeactivationCheck';

const ListJdOfCompany = () => {
    // Check if company is deactivated and prevent access
    useCompanyDeactivationCheck(['/recruiter/settings']);

    return (
        <div className="recruiter-page-container">
            <JdList />
        </div>
    );
}

export default ListJdOfCompany;