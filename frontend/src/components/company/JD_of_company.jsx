import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import "./JD_of_companny.css";

const JD_of_company = () => {
      const {id} = useParams();
      const [job, setJob] = useState(null);
      const [searchTerm, setSearchTerm] = useState('');
      const [isLoading, setIsLoading] = useState(true);
    
      const get_API_data = async (id) => {
          try {
              setIsLoading(true);
              const response = await fetch(`http://localhost:3001/jobs/${id}`, {
                  method: 'GET',
                  headers: {
                      'Content-Type': 'application/json',
                  },
              });
              const data = await response.json();
              if (response.ok) {
                  setJob(data);
                  console.log("Fetched job:", data);
              }
          } catch (err) {
              console.error("Error fetching job:", err);
          } finally {
              setIsLoading(false);
          }
      };

      useEffect(() => {
          if (id) {
              get_API_data(id);
          }
      }, [id]);

    return (
        <main className="JD-company-main">
            {isLoading ? (
                <div>Loading...</div>
            ) : job ? (
                <div>
                    <div className="title_header">
                        <div className="in4_company">
                            <div className="img_logo">
                                <img src={job.logo} alt="Company Logo" />
                            </div>
                            <div className="detail_company">
                                <h1 className="postion-tag">
                                    <i className="fas fa-user-tie"></i> {job.position}
                                </h1>
                                <h1 className="company-tag">
                                    <i className="fas fa-building"></i> {job.company}
                                </h1>
                                <div className="location-status">
                                    <h1 className="location-tag">
                                        <i className="fas fa-map-marker-alt"></i> {job.location}
                                    </h1>
                                    <div className="dot"></div>
                                    <h1 className="status-tag">
                                        <i className="fas fa-briefcase"></i> {job.status}
                                    </h1>
                                </div>
                            </div> 
                        </div>
                        <div className="tags_of_JD">
                             {/* tag short_description */}
                                <div className="short_description">
                                    <div className="tag-description">
                                        {job.tags.map((tag, index) => 
                                            <span key={index} className="tag-item">{tag}</span>
                                        )}
                                    </div>

                                </div>
                        </div>
                        <div className="Action_tag">
                            <button className="apply_now">Ứng tuyển ngay </button>
                            <button className="AI_analyze">AI phân tích</button>
                        </div>
                    </div>
                    <div className="description">
                        { job.in4 && job.in4.map((section, index) => {
                            const key = Object.keys(section)[0];
                            const sectionData = section[key];
                            return (
                                <div className="jd-section" key={index}>
                                    <h2 className="jd-title">{sectionData.title}</h2>

                                    {/* description is a string */}
                                    {typeof sectionData.description === "string" && (
                                        <p className="jd-text">{sectionData.description}</p>
                                    )}

                                    {/* description is an array */}
                                    {Array.isArray(sectionData.description) && (
                                        <ul className="jd-list">
                                            {sectionData.description.map((line, i) => (
                                                <li key={i}>{line}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        } )}
                    </div>
                

                </div>
            ) : (
                <div>No job found.</div>
            )}
        </main>
    );
}

export default JD_of_company;
