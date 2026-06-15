import axios from "axios";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Context } from "../../main";

const Application = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();
  const { id } = useParams();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError("");
    if (!file) { setResume(null); return; }
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Please select a valid image file (PNG, JPEG, or WEBP).");
      setResume(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError("File size must be less than 2MB.");
      setResume(null);
      return;
    }
    setResume(file);
  };

  const handleApplication = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !coverLetter) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!resume) { setFileError("Please upload your resume image."); return; }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("coverLetter", coverLetter);
    formData.append("resume", resume);
    formData.append("jobId", id);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/application/post`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setName(""); setEmail(""); setCoverLetter(""); setPhone(""); setAddress(""); setResume(null);
      toast.success(data.message);
      navigateTo("/job/getall");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized || (user && user.role === "Employer")) {
    return <Navigate to="/login" />;
  }

  return (
    <section className="application">
      <div className="container">
        <h3>Apply for This Job</h3>
        <form onSubmit={handleApplication}>
          <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="number" placeholder="Your Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input type="text" placeholder="Your Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          <textarea placeholder="Write your cover letter..." value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} required />
          <div>
            <label style={{ textAlign: "start", display: "block", fontSize: "18px", fontWeight: "600" }}>
              Upload Resume
              <p style={{ color: "#888", fontSize: "13px", marginTop: "4px", fontWeight: "400" }}>
                Accepted formats: PNG, JPEG, WEBP — Max 2MB
              </p>
            </label>
            <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleFileChange} style={{ width: "100%" }} />
            {fileError && <p style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>{fileError}</p>}
          </div>
          <button type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Application;