import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate } from "react-router-dom";
import { Context } from "../../main";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const { isAuthorized } = useContext(Context);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/job/getall`, { withCredentials: true })
      .then((res) => setJobs(res.data))
      .catch((err) => console.log(err));
  }, []);

  if (!isAuthorized) return <Navigate to="/login" />;

  return (
    <section className="jobs page">
      <div className="container">
        <h1>All Available Jobs</h1>
        <div className="banner">
          {jobs.jobs &&
            jobs.jobs.map((element) => (
              <div className="card" key={element._id}>
                <p>{element.title}</p>
                <p>{element.category}</p>
                <p>{element.country}</p>
                <Link to={`/job/${element._id}`}>View Details</Link>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Jobs;