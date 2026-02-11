import React, { useState } from 'react';
import './CompanyGrid.css';

const MOCK_COMPANIES = [
    { id: 1, name: 'Tech Solutions Inc.', logo: 'https://via.placeholder.com/80', description: 'Leading provider of enterprise software solutions.', jobs: 12 },
    { id: 2, name: 'Creative Web Agency', logo: 'https://via.placeholder.com/80', description: 'Award-winning digital agency specializing in UI/UX.', jobs: 5 },
    { id: 3, name: 'Global Finance Corp', logo: 'https://via.placeholder.com/80', description: 'International banking and financial services.', jobs: 8 },
    { id: 4, name: 'EduTech Systems', logo: 'https://via.placeholder.com/80', description: 'Transforming education through technology.', jobs: 3 },
    { id: 5, name: 'HealthPlus', logo: 'https://via.placeholder.com/80', description: 'Innovative healthcare solutions for modern living.', jobs: 7 },
    { id: 6, name: 'Green Energy Co.', logo: 'https://via.placeholder.com/80', description: 'Sustainable energy solutions for a better future.', jobs: 4 },
    { id: 7, name: 'Logistics Pro', logo: 'https://via.placeholder.com/80', description: 'Global logistics and supply chain management.', jobs: 9 },
    { id: 8, name: 'Smart Home IoT', logo: 'https://via.placeholder.com/80', description: 'Connecting your home with smart technology.', jobs: 6 },
    // A duplicate set to demonstrate pagination
    { id: 9, name: 'Tech Solutions Inc. 2', logo: 'https://via.placeholder.com/80', description: 'Leading provider of enterprise software solutions.', jobs: 12 },
    { id: 10, name: 'Creative Web Agency 2', logo: 'https://via.placeholder.com/80', description: 'Award-winning digital agency specializing in UI/UX.', jobs: 5 },
];

const ITEMS_ER_PAGE = 6;

const CompanyGrid = () => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(MOCK_COMPANIES.length / ITEMS_ER_PAGE);

    const currentCompanies = MOCK_COMPANIES.slice(
        (currentPage - 1) * ITEMS_ER_PAGE,
        currentPage * ITEMS_ER_PAGE
    );

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <section className="company-grid-section" id="company-grid">
            <div className="company-grid-header">
                <h2>Top Companies Hiring</h2>
            </div>

            <div className="company-grid">
                {currentCompanies.map(company => (
                    <div key={company.id} className="company-card">
                        <div className="company-grid-logo-wrapper">
                            <div className="company-grid-logo">
                                {company.name.charAt(0)}
                            </div>
                        </div>
                        <h3 className="company-name">{company.name}</h3>
                        <p className="company-desc">{company.description}</p>
                        <span className="company-jobs-count">{company.jobs} Open Jobs</span>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        &gt;
                    </button>
                </div>
            )}
        </section>
    );
};

export default CompanyGrid;
