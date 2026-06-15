import React from "react";
import { FaUserPlus } from "react-icons/fa";
import { MdFindInPage } from "react-icons/md";
import { IoMdSend } from "react-icons/io";

const HowItWorks = () => {
  return (
    <div className="howitworks">
      <div className="container">
        <h3>How JobHive Works</h3>
        <div className="banner">
          <div className="card">
            <FaUserPlus />
            <p>Create an Account</p>
            <p>Sign up as a Job Seeker or Employer in minutes — completely free.</p>
          </div>
          <div className="card">
            <MdFindInPage />
            <p>Find or Post a Job</p>
            <p>Browse listings tailored to your skills, or post roles to attract top talent.</p>
          </div>
          <div className="card">
            <IoMdSend />
            <p>Apply or Hire</p>
            <p>Submit your application or review candidates and build your team.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;