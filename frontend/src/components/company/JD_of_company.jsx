import React, { useState, useEffect } from "react";
import { useParams } from "react-router";


const JD_of_company = () => {
      const {id} = useParams();
      const [job, setJob] = useState(null);
      const [searchTerm, setSearchTerm] = useState('');
      const [isLoading, setIsLoading] = useState(true);
    
      const get_API_data = async (id) => {
          try {
              setIsLoading(true);
              const response = await fetch(`http://localhost:5001/jobs/${id}`, {
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
                    <h1>{job.position}</h1>
                    <p>Company: {job.company}</p>
                    <p>Location: {job.location}</p>
                    <p>Salary: ${job.salary?.min}k - ${job.salary?.max}k</p>
                    <p>Description: {job.description}</p>
                </div>
            ) : (
                <div>No job found.</div>
            )}
        </main>
    );
}

export default JD_of_company;
