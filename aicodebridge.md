# react-job-portal-main — AICodeBridge
> 6/15/2026, 11:45:30 AM | 📄 Full

---

**react-job-portal-main** —  project.

## 🛠 Stack


## ⭐ Key Files

- `backend/controllers/applicationController.js` — Controller
- `backend/controllers/jobController.js` — Controller
- `backend/controllers/userController.js` — Controller
- `backend/middlewares/auth.js` — Auth
- `backend/routes/applicationRoutes.js` — Route
- `backend/routes/jobRoutes.js` — Route
- `backend/routes/userRoutes.js` — Route
- `backend/server.js` — Entry

## 📎 Code

### backend/controllers/applicationController.js _(158 lines)_
```javascript
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import cloudinary from "cloudinary";

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }
  
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Resume File Required!", 400));
  }

  const { resume } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(resume.mimetype)) {
    return next(
      new ErrorHandler("Invalid file type. Please upload a PNG, JPEG, or WEBP file.", 400)
    );
  }
  
  try {
    const cloudinaryResponse = await cloudinary.uploader.upload(
      resume.tempFilePath
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      console.error(
        "Cloudinary Error:",
        cloudinaryResponse.error || "Unknown Cloudinary error"
      );
      return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
    }
    
    const { name, email, coverLetter, phone, address, jobId } = req.body;
    const applicantID = {
      user: req.user._id,
      role: "Job Seeker",
    };
    
    if (!jobId) {
      return next(new ErrorHandler("Job not found!", 404));
    }
    
    const jobDetails = await Job.findById(jobId);
    if (!jobDetails) {
      return next(new ErrorHandler("Job not found!", 404));
    }

    const employerID = {
      user: jobDetails.postedBy,
      role: "Employer",
    };
    
    if (
      !name ||
      !email ||
      !coverLetter ||
      !phone ||
      !address ||
      !applicantID ||
      !employerID ||
      !resume
    ) {
      return next(new ErrorHandler("Please fill all fields.", 400));
    }
    
    const application = await Application.create({
      name,
      email,
      coverLetter,
      phone,
      address,
      applicantID,
      employerID,
      resume: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
    });
    
    res.status(200).json({
      success: true,
      message: "Application Submitted!",
      application,
    });
  } catch (error) {
    // Handle Cloudinary specific errors
    if (error.message && error.message.includes("api_key")) {
      console.error("Cloudinary API key error:", error.message);
      return next(new ErrorHandler("File upload service configuration error", 500));
    }
    
    // Handle any other errors
    return next(error);
  }
});

export const employerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Job Seeker") {
      return next(
        new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "employerID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "applicantID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }
    await application.deleteOne();
    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
  }
);
```

### backend/controllers/jobController.js _(141 lines)_
```javascript
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ expired: false });
  res.status(200).json({
    success: true,
    jobs,
  });
});

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const {
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
  } = req.body;

  if (!title || !description || !category || !country || !city || !location) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(
      new ErrorHandler(
        "Please either provide fixed salary or ranged salary.",
        400
      )
    );
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(
      new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400)
    );
  }
  const postedBy = req.user._id;
  const job = await Job.create({
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    postedBy,
  });
  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const myJobs = await Job.find({ postedBy: req.user._id });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Job Updated!",
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});
```

### backend/controllers/userController.js _(76 lines)_
```javascript
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill full form !"));
  }
  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered !"));
  }
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
  });
  sendToken(user, 201, res, "User Registered Sucessfully !");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email ,password and role !"));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password !", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} not found !`, 404)
    );
  }
  sendToken(user, 201, res, "User Logged In Sucessfully !");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    })
    .json({
      success: true,
      message: "Logged Out Successfully !",
    });
});


export const getUser = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  // Sanitize user data to remove sensitive fields
  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  res.status(200).json({
    success: true,
    user: sanitizedUser,
  });
});
```

### backend/database/dbConnection.js _(17 lines)_
```javascript
import mongoose from "mongoose"; //just mongoose import!
import dotenv from "dotenv"
dotenv.config()

//Database connection here!
 const dbConnection  = ()=>{
    mongoose.connect(process.env.DB_URL,{
       dbName: "Job_Portal"

    }).then(()=>{ //agar connect ho jaye toh!
       console.log("MongoDB Connected Sucessfully !")
    }).catch((error)=>{
        console.log(`Failed to connect ${error}`) //warna error de do console me!
    })
    
}
export default dbConnection;
```

### backend/middlewares/auth.js _(17 lines)_
```javascript
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  req.user = await User.findById(decoded.id);

  next();
});
```

### backend/middlewares/catchAsyncError.js _(6 lines)_
```javascript
export const catchAsyncErrors = (theFunction) => {
  return (req, res, next) => {
    Promise.resolve(theFunction(req, res, next)).catch(next);
  };
};
```

### backend/middlewares/error.js _(50 lines)_
```javascript
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  // Normalize err to always be an ErrorHandler instance
  if (typeof err === "string") {
    err = new ErrorHandler(err, 500);
  } else if (!(err instanceof Error)) {
    err = new ErrorHandler("Internal Server Error", 500);
  }

  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  // Handle invalid MongoDB ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid value for field: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400);
  }

  // Handle invalid JWT
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, Try again please!`;
    err = new ErrorHandler(message, 400);
  }

  // Handle expired JWT
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is expired, Try again please!`;
    err = new ErrorHandler(message, 400);
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default ErrorHandler;
```

### backend/models/applicationSchema.js _(65 lines)_
```javascript
import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email!"],
    validate: [validator.isEmail, "Please provide a valid Email!"],
  },
  coverLetter: {
    type: String,
    required: [true, "Please provide a cover letter!"],
  },
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  address: {
    type: String,
    required: [true, "Please enter your Address!"],
  },
  resume: {
    public_id: {
      type: String, 
      required: true,
    },
    url: {
      type: String, 
      required: true,
    },
  },
  applicantID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Job Seeker"],
      required: true,
    },
  },
  employerID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Employer"],
      required: true,
    },
  },
});

export const Application = mongoose.model("Application", applicationSchema);
```

### backend/models/jobSchema.js _(64 lines)_
```javascript
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title."],
    minLength: [3, "Title must contain at least 3 Characters!"],
    maxLength: [30, "Title cannot exceed 30 Characters!"],
  },
  description: {
    type: String,
    required: [true, "Please provide decription."],
    minLength: [30, "Description must contain at least 30 Characters!"],
    maxLength: [500, "Description cannot exceed 500 Characters!"],
  },
  category: {
    type: String,
    required: [true, "Please provide a category."],
  },
  country: {
    type: String,
    required: [true, "Please provide a country name."],
  },
  city: {
    type: String,
    required: [true, "Please provide a city name."],
  },
  location: {
    type: String,
    required: [true, "Please provide location."],
    minLength: [20, "Location must contian at least 20 characters!"],
  },
  fixedSalary: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  salaryFrom: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  salaryTo: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  expired: {
    type: Boolean,
    default: false,
  },
  jobPostedOn: {
    type: Date,
    default: Date.now,
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

export const Job = mongoose.model("Job", jobSchema);
```

### backend/models/userSchema.js _(61 lines)_
```javascript
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email!"],
    validate: [validator.isEmail, "Please provide a valid Email!"],
  },
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  password: {
    type: String,
    required: [true, "Please provide a Password!"],
    minLength: [8, "Password must contain at least 8 characters!"],
    maxLength: [32, "Password cannot exceed 32 characters!"],
    select: false,
  },
  role: {
    type: String,
    required: [true, "Please select a role"],
    enum: ["Job Seeker", "Employer"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


//ENCRYPTING THE PASSWORD WHEN THE USER REGISTERS OR MODIFIES HIS PASSWORD
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//COMPARING THE USER PASSWORD ENTERED BY USER WITH THE USER SAVED PASSWORD
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//GENERATING A JWT TOKEN WHEN A USER REGISTERS OR LOGINS, IT DEPENDS ON OUR CODE THAT WHEN DO WE NEED TO GENERATE THE JWT TOKEN WHEN THE USER LOGIN OR REGISTER OR FOR BOTH. 
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const User = mongoose.model("User", userSchema);
```

### backend/routes/applicationRoutes.js _(18 lines)_
```javascript
import express from "express";
import {
  employerGetAllApplications,
  jobseekerDeleteApplication,
  jobseekerGetAllApplications,
  postApplication,
} from "../controllers/applicationController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isAuthenticated, postApplication);
router.get("/employer/getall", isAuthenticated, employerGetAllApplications);
router.get("/jobseeker/getall", isAuthenticated, jobseekerGetAllApplications);
router.delete("/delete/:id", isAuthenticated, jobseekerDeleteApplication);

export default router;
```

### backend/routes/jobRoutes.js _(22 lines)_
```javascript
import express from "express";
import {
  deleteJob,
  getAllJobs,
  getMyJobs,
  getSingleJob,
  postJob,
  updateJob,
} from "../controllers/jobController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", getAllJobs);
router.post("/post", isAuthenticated, postJob);
router.get("/getmyjobs", isAuthenticated, getMyJobs);
router.put("/update/:id", isAuthenticated, updateJob);
router.delete("/delete/:id", isAuthenticated, deleteJob);
router.get("/:id", isAuthenticated, getSingleJob);

export default router;
```

### backend/routes/userRoutes.js _(13 lines)_
```javascript
import express from "express";
import { login, register, logout, getUser } from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/getuser", isAuthenticated, getUser);

export default router;
```

### backend/utils/jwtToken.js _(18 lines)_
```javascript
export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Set httpOnly to true
    path: "/",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    message,
    token,
  });
};
```

### backend/app.js _(40 lines)_
```javascript
import express from "express";
import dbConnection  from "./database/dbConnection.js";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import { config } from "dotenv";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

const app = express();
config({ path: "./config/config.env" });

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    method: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
dbConnection();

app.use(errorMiddleware);
export default app;
```

### backend/package.json _(29 lines)_
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cloudinary": "^1.41.2",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-fileupload": "^1.4.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "validator": "^13.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.7"
  }
}
```

### backend/server.js _(13 lines)_
```javascript
import app from "./app.js";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // CLOUDINARY_CLIENT_NAME
  api_key: process.env.CLOUDINARY_API_KEY,       // CLOUDINARY_CLIENT_API
  api_secret: process.env.CLOUDINARY_API_SECRET, // CLOUDINARY_CLIENT_SECRET
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
```

### frontend/src/components/Application/Application.jsx _(106 lines)_
```jsx
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
```

### frontend/src/components/Application/MyApplications.jsx _(110 lines)_
```jsx
import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Navigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const MyApplications = () => {
  const { user, isAuthorized } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const url = user && user.role === "Employer"
          ? `${import.meta.env.VITE_API_URL}/application/employer/getall`
          : `${import.meta.env.VITE_API_URL}/application/jobseeker/getall`;
        const res = await axios.get(url, { withCredentials: true });
        setApplications(res.data.applications);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch applications.");
      }
    };
    if (isAuthorized) fetchApplications();
  }, [isAuthorized, user]);

  if (!isAuthorized) return <Navigate to="/login" />;

  const deleteApplication = async (id) => {
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/application/delete/${id}`,
        { withCredentials: true }
      );
      toast.success(res.data.message);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed.");
    }
  };

  const openModal = (imageUrl) => { setResumeImageUrl(imageUrl); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  return (
    <section className="my_applications page">
      {user && user.role === "Job Seeker" ? (
        <div className="container">
          <center><h1>My Applications</h1></center>
          {applications.length === 0 ? (
            <center><h4>No applications found.</h4></center>
          ) : (
            applications.map((element) => (
              <JobSeekerCard key={element._id} element={element} deleteApplication={deleteApplication} openModal={openModal} />
            ))
          )}
        </div>
      ) : (
        <div className="container">
          <center><h1>Applications Received</h1></center>
          {applications.length === 0 ? (
            <center><h4>No applications found.</h4></center>
          ) : (
            applications.map((element) => (
              <EmployerCard key={element._id} element={element} openModal={openModal} />
            ))
          )}
        </div>
      )}
      {modalOpen && <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />}
    </section>
  );
};

export default MyApplications;

const JobSeekerCard = ({ element, deleteApplication, openModal }) => (
  <div className="job_seeker_card">
    <div className="detail">
      <p><span>Name:</span> {element.name}</p>
      <p><span>Email:</span> {element.email}</p>
      <p><span>Phone:</span> {element.phone}</p>
      <p><span>Address:</span> {element.address}</p>
      <p><span>Cover Letter:</span> {element.coverLetter}</p>
    </div>
    <div className="resume">
      <img src={element.resume.url} alt="resume" onClick={() => openModal(element.resume.url)} />
    </div>
    <div className="btn_area">
      <button onClick={() => deleteApplication(element._id)}>Delete Application</button>
    </div>
  </div>
);

const EmployerCard = ({ element, openModal }) => (
  <div className="job_seeker_card">
    <div className="detail">
      <p><span>Name:</span> {element.name}</p>
      <p><span>Email:</span> {element.email}</p>
      <p><span>Phone:</span> {element.phone}</p>
      <p><span>Address:</span> {element.address}</p>
      <p><span>Cover Letter:</span> {element.coverLetter}</p>
    </div>
    <div className="resume">
      <img src={element.resume.url} alt="resume" onClick={() => openModal(element.resume.url)} />
    </div>
  </div>
);
```

### frontend/src/components/Application/ResumeModal.jsx _(14 lines)_
```jsx
import React from "react";

const ResumeModal = ({ imageUrl, onClose }) => {
  return (
    <div className="resume-modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <img src={imageUrl} alt="resume" />
      </div>
    </div>
  );
};

export default ResumeModal;
```

### frontend/src/components/Auth/Login.jsx _(109 lines)_
```jsx
import React, { useContext, useState } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Link, Navigate } from "react-router-dom";
import { FaRegUser, FaBriefcase } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthorized, setIsAuthorized } = useContext(Context);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/login`,
        { email, password, role },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      toast.success(data.message);
      setEmail("");
      setPassword("");
      setRole("");
      setIsAuthorized(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthorized) return <Navigate to="/" />;

  return (
    <section className="authPage">
      <div className="container">
        <div className="header">
          <div className="brand-logo">
            <FaBriefcase />
            <span>JobHive</span>
          </div>
          <h3>Welcome back</h3>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="inputTag">
            <label>Login As</label>
            <div>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select Role</option>
                <option value="Job Seeker">Job Seeker</option>
                <option value="Employer">Employer</option>
              </select>
              <FaRegUser />
            </div>
          </div>
          <div className="inputTag">
            <label>Email Address</label>
            <div>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <MdOutlineMailOutline />
            </div>
          </div>
          <div className="inputTag">
            <label>Password</label>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>
          <button type="submit" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <Link to="/register">Don't have an account? Register</Link>
        </form>
      </div>
      <div className="banner">
        <img src="/login.png" alt="login illustration" />
      </div>
    </section>
  );
};

export default Login;
```

### frontend/src/components/Auth/Register.jsx _(119 lines)_
```jsx
import React, { useContext, useState } from "react";
import { FaRegUser, FaBriefcase } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaPencilAlt, FaPhoneAlt } from "react-icons/fa";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthorized, setIsAuthorized } = useContext(Context);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/register`,
        { name, phone, email, role, password },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      toast.success(data.message);
      setName(""); setEmail(""); setPassword(""); setPhone(""); setRole("");
      setIsAuthorized(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthorized) return <Navigate to="/" />;

  return (
    <section className="authPage">
      <div className="container">
        <div className="header">
          <div className="brand-logo">
            <FaBriefcase />
            <span>JobHive</span>
          </div>
          <h3>Create your account</h3>
          <p className="auth-subtitle">Join thousands finding great work</p>
        </div>
        <form onSubmit={handleRegister}>
          <div className="inputTag">
            <label>Register As</label>
            <div>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select Role</option>
                <option value="Employer">Employer</option>
                <option value="Job Seeker">Job Seeker</option>
              </select>
              <FaRegUser />
            </div>
          </div>
          <div className="inputTag">
            <label>Full Name</label>
            <div>
              <input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
              <FaPencilAlt />
            </div>
          </div>
          <div className="inputTag">
            <label>Email Address</label>
            <div>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <MdOutlineMailOutline />
            </div>
          </div>
          <div className="inputTag">
            <label>Phone Number</label>
            <div>
              <input type="number" placeholder="Your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <FaPhoneAlt />
            </div>
          </div>
          <div className="inputTag">
            <label>Password</label>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>
          <button type="submit" onClick={handleRegister} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <Link to="/login">Already have an account? Sign in</Link>
        </form>
      </div>
      <div className="banner">
        <img src="/register.png" alt="register illustration" />
      </div>
    </section>
  );
};

export default Register;
```

### frontend/src/components/Home/HeroSection.jsx _(67 lines)_
```jsx
import React from "react";
import { FaBuilding, FaSuitcase, FaUsers, FaUserPlus } from "react-icons/fa";

const HeroSection = () => {
  const details = [
    {
      id: 1,
      title: "1,23,441",
      subTitle: "Live Job",
      icon: <FaSuitcase />,
    },
    {
      id: 2,
      title: "91220",
      subTitle: "Companies",
      icon: <FaBuilding />,
    },
    {
      id: 3,
      title: "2,34,200",
      subTitle: "Job Seekers",
      icon: <FaUsers />,
    },
    {
      id: 4,
      title: "1,03,761",
      subTitle: "Employers",
      icon: <FaUserPlus />,
    },
  ];
  return (
    <>
      <div className="heroSection">
        <div className="container">
          <div className="title">
            <h1>Find a job that suits</h1>
            <h1>your interests and skills</h1>
            <p>
              Discover job opportunities that match your skills and passions.
              Connect with employers seeking talent like yours for rewarding
              careers.
            </p>
          </div>
          <div className="image">
            <img src="/heroS.jpg" alt="hero" />
          </div>
        </div>
        <div className="details">
          {details.map((element) => {
            return (
              <div className="card" key={element.id}>
                <div className="icon">{element.icon}</div>
                <div className="content">
                  <p>{element.title}</p>
                  <p>{element.subTitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default HeroSection;
```

### frontend/src/components/Home/Home.jsx _(24 lines)_
```jsx
import React, { useContext } from "react";
import { Context } from "../../main";
import { Navigate } from "react-router-dom";
import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import PopularCategories from "./PopularCategories";
import PopularCompanies from "./PopularCompanies";

const Home = () => {
  const { isAuthorized } = useContext(Context);
  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }
  return (
    <section className="homePage page">
      <HeroSection />
      <HowItWorks />
      <PopularCategories />
      <PopularCompanies />
    </section>
  );
};

export default Home;
```

### frontend/src/components/Home/HowItWorks.jsx _(33 lines)_
```jsx
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
```

### frontend/src/components/Home/PopularCategories.jsx _(43 lines)_
```jsx
import React from "react";
import {
  MdOutlineDesignServices,
  MdOutlineWebhook,
  MdAccountBalance,
  MdOutlineAnimation,
} from "react-icons/md";
import { TbAppsFilled } from "react-icons/tb";
import { FaReact } from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
import { IoGameController } from "react-icons/io5";

const PopularCategories = () => {
  const categories = [
    { id: 1, title: "Graphics & Design", subTitle: "305 Open Positions", icon: <MdOutlineDesignServices /> },
    { id: 2, title: "Mobile App Development", subTitle: "500 Open Positions", icon: <TbAppsFilled /> },
    { id: 3, title: "Frontend Web Development", subTitle: "200 Open Positions", icon: <MdOutlineWebhook /> },
    { id: 4, title: "MERN Stack Development", subTitle: "1000+ Open Positions", icon: <FaReact /> },
    { id: 5, title: "Account & Finance", subTitle: "150 Open Positions", icon: <MdAccountBalance /> },
    { id: 6, title: "Artificial Intelligence", subTitle: "867 Open Positions", icon: <GiArtificialIntelligence /> },
    { id: 7, title: "Video Animation", subTitle: "50 Open Positions", icon: <MdOutlineAnimation /> },
    { id: 8, title: "Game Development", subTitle: "80 Open Positions", icon: <IoGameController /> },
  ];

  return (
    <div className="categories">
      <h3>Popular Categories</h3>
      <div className="banner">
        {categories.map((element) => (
          <div className="card" key={element.id}>
            <div className="icon">{element.icon}</div>
            <div className="text">
              <p>{element.title}</p>
              <p>{element.subTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularCategories;
```

### frontend/src/components/Home/PopularCompanies.jsx _(35 lines)_
```jsx
import React from "react";
import { FaMicrosoft, FaApple } from "react-icons/fa";
import { SiTesla } from "react-icons/si";

const PopularCompanies = () => {
  const companies = [
    { id: 1, title: "Microsoft", location: "Millennium City Centre, Gurugram", openPositions: 10, icon: <FaMicrosoft /> },
    { id: 2, title: "Tesla", location: "Millennium City Centre, Gurugram", openPositions: 5, icon: <SiTesla /> },
    { id: 3, title: "Apple", location: "Millennium City Centre, Gurugram", openPositions: 20, icon: <FaApple /> },
  ];

  return (
    <div className="companies">
      <div className="container">
        <h3>Top Companies Hiring</h3>
        <div className="banner">
          {companies.map((element) => (
            <div className="card" key={element.id}>
              <div className="content">
                <div className="icon">{element.icon}</div>
                <div className="text">
                  <p>{element.title}</p>
                  <p>{element.location}</p>
                </div>
              </div>
              <button>Open Positions: {element.openPositions}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularCompanies;
```

### frontend/src/components/Job/JobDetails.jsx _(50 lines)_
```jsx
import React, { useContext, useEffect, useState } from "react";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Context } from "../../main";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState({});
  const navigateTo = useNavigate();
  const { isAuthorized, user } = useContext(Context);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/job/${id}`, { withCredentials: true })
      .then((res) => setJob(res.data.job))
      .catch(() => navigateTo("/notfound"));
  }, []);

  if (!isAuthorized) return <Navigate to="/login" />;

  return (
    <section className="jobDetail page">
      <div className="container">
        <h3>Job Details</h3>
        <div className="banner">
          <p>Title: <span>{job.title}</span></p>
          <p>Category: <span>{job.category}</span></p>
          <p>Country: <span>{job.country}</span></p>
          <p>City: <span>{job.city}</span></p>
          <p>Location: <span>{job.location}</span></p>
          <p>Description: <span>{job.description}</span></p>
          <p>Posted On: <span>{job.jobPostedOn}</span></p>
          <p>
            Salary:{" "}
            {job.fixedSalary ? (
              <span>₹{job.fixedSalary}</span>
            ) : (
              <span>₹{job.salaryFrom} – ₹{job.salaryTo}</span>
            )}
          </p>
          {user && user.role !== "Employer" && (
            <Link to={`/application/${job._id}`}>Apply Now</Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobDetails;
```

### frontend/src/components/Job/Jobs.jsx _(39 lines)_
```jsx
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
```

### frontend/src/components/Job/MyJobs.jsx _(120 lines)_
```jsx
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { Context } from "../../main";
import { Navigate } from "react-router-dom";

const MyJobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [editingMode, setEditingMode] = useState(null);
  const { isAuthorized, user } = useContext(Context);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/job/getmyjobs`, { withCredentials: true })
      .then((res) => setMyJobs(res.data.myJobs))
      .catch((err) => { toast.error(err.response?.data?.message || "Failed to fetch jobs."); setMyJobs([]); });
  }, []);

  if (!isAuthorized || (user && user.role !== "Employer")) return <Navigate to="/login" />;

  const handleEnableEdit = (jobId) => setEditingMode(jobId);
  const handleDisableEdit = () => setEditingMode(null);

  const handleUpdateJob = async (jobId) => {
    const updatedJob = myJobs.find((job) => job._id === jobId);
    await axios
      .put(`${import.meta.env.VITE_API_URL}/job/update/${jobId}`, updatedJob, { withCredentials: true })
      .then((res) => { toast.success(res.data.message); setEditingMode(null); })
      .catch((err) => toast.error(err.response?.data?.message || "Update failed."));
  };

  const handleDeleteJob = async (jobId) => {
    await axios
      .delete(`${import.meta.env.VITE_API_URL}/job/delete/${jobId}`, { withCredentials: true })
      .then((res) => { toast.success(res.data.message); setMyJobs((prev) => prev.filter((job) => job._id !== jobId)); })
      .catch((err) => toast.error(err.response?.data?.message || "Delete failed."));
  };

  const handleInputChange = (jobId, field, value) => {
    setMyJobs((prev) => prev.map((job) => job._id === jobId ? { ...job, [field]: value } : job));
  };

  return (
    <div className="myJobs page">
      <div className="container">
        <h1>Your Posted Jobs</h1>
        {myJobs.length > 0 ? (
          <div className="banner">
            {myJobs.map((element) => (
              <div className="card" key={element._id}>
                <div className="content">
                  <div className="short_fields">
                    <div><span>Title:</span><input type="text" disabled={editingMode !== element._id} value={element.title} onChange={(e) => handleInputChange(element._id, "title", e.target.value)} /></div>
                    <div><span>Country:</span><input type="text" disabled={editingMode !== element._id} value={element.country} onChange={(e) => handleInputChange(element._id, "country", e.target.value)} /></div>
                    <div><span>City:</span><input type="text" disabled={editingMode !== element._id} value={element.city} onChange={(e) => handleInputChange(element._id, "city", e.target.value)} /></div>
                    <div>
                      <span>Category:</span>
                      <select value={element.category} onChange={(e) => handleInputChange(element._id, "category", e.target.value)} disabled={editingMode !== element._id}>
                        <option value="Graphics & Design">Graphics & Design</option>
                        <option value="Mobile App Development">Mobile App Development</option>
                        <option value="Frontend Web Development">Frontend Web Development</option>
                        <option value="MERN Stack Development">MERN Stack Development</option>
                        <option value="Account & Finance">Account & Finance</option>
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                        <option value="Video Animation">Video Animation</option>
                        <option value="MEAN Stack Development">MEAN Stack Development</option>
                        <option value="Data Entry Operator">Data Entry Operator</option>
                      </select>
                    </div>
                    <div>
                      <span>Salary:</span>
                      {element.fixedSalary ? (
                        <input type="number" disabled={editingMode !== element._id} value={element.fixedSalary} onChange={(e) => handleInputChange(element._id, "fixedSalary", e.target.value)} />
                      ) : (
                        <div>
                          <input type="number" disabled={editingMode !== element._id} value={element.salaryFrom} onChange={(e) => handleInputChange(element._id, "salaryFrom", e.target.value)} />
                          <input type="number" disabled={editingMode !== element._id} value={element.salaryTo} onChange={(e) => handleInputChange(element._id, "salaryTo", e.target.value)} />
                        </div>
                      )}
                    </div>
                    <div>
                      <span>Expired:</span>
                      <select value={element.expired} onChange={(e) => handleInputChange(element._id, "expired", e.target.value)} disabled={editingMode !== element._id}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                      </select>
                    </div>
                  </div>
                  <div className="long_field">
                    <div><span>Description:</span><textarea rows={5} value={element.description} disabled={editingMode !== element._id} onChange={(e) => handleInputChange(element._id, "description", e.target.value)} /></div>
                    <div><span>Location:</span><textarea value={element.location} rows={5} disabled={editingMode !== element._id} onChange={(e) => handleInputChange(element._id, "location", e.target.value)} /></div>
                  </div>
                </div>
                <div className="button_wrapper">
                  <div className="edit_btn_wrapper">
                    {editingMode === element._id ? (
                      <>
                        <button onClick={() => handleUpdateJob(element._id)} className="check_btn"><FaCheck /></button>
                        <button onClick={handleDisableEdit} className="cross_btn"><RxCross2 /></button>
                      </>
                    ) : (
                      <button onClick={() => handleEnableEdit(element._id)} className="edit_btn">Edit</button>
                    )}
                  </div>
                  <button onClick={() => handleDeleteJob(element._id)} className="delete_btn">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You haven't posted any jobs yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyJobs;
```

### frontend/src/components/Job/PostJob.jsx _(92 lines)_
```jsx
import React, { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Navigate } from "react-router-dom";
import { Context } from "../../main";

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryType, setSalaryType] = useState("default");

  const { isAuthorized, user } = useContext(Context);

  const handleJobPost = async (e) => {
    e.preventDefault();
    const payload =
      salaryType === "Fixed Salary"
        ? { title, description, category, country, city, location, fixedSalary }
        : { title, description, category, country, city, location, salaryFrom, salaryTo };

    await axios
      .post(`${import.meta.env.VITE_API_URL}/job/post`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => toast.success(res.data.message))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to post job."));
  };

  if (!isAuthorized || (user && user.role !== "Employer")) return <Navigate to="/login" />;

  return (
    <div className="job_post page">
      <div className="container">
        <h3>Post a New Job</h3>
        <form onSubmit={handleJobPost}>
          <div className="wrapper">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job Title" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select Category</option>
              <option value="Graphics & Design">Graphics & Design</option>
              <option value="Mobile App Development">Mobile App Development</option>
              <option value="Frontend Web Development">Frontend Web Development</option>
              <option value="Business Development Executive">Business Development Executive</option>
              <option value="Account & Finance">Account & Finance</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Video Animation">Video Animation</option>
              <option value="MEAN Stack Development">MEAN Stack Development</option>
              <option value="MERN Stack Development">MERN Stack Development</option>
              <option value="Data Entry Operator">Data Entry Operator</option>
            </select>
          </div>
          <div className="wrapper">
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          </div>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Full Location / Address" />
          <div className="salary_wrapper">
            <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)}>
              <option value="default">Select Salary Type</option>
              <option value="Fixed Salary">Fixed Salary</option>
              <option value="Ranged Salary">Ranged Salary</option>
            </select>
            <div>
              {salaryType === "default" && <p>Please select a salary type *</p>}
              {salaryType === "Fixed Salary" && (
                <input type="number" placeholder="Fixed Salary (₹)" value={fixedSalary} onChange={(e) => setFixedSalary(e.target.value)} />
              )}
              {salaryType === "Ranged Salary" && (
                <div className="ranged_salary">
                  <input type="number" placeholder="From (₹)" value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} />
                  <input type="number" placeholder="To (₹)" value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} />
                </div>
              )}
            </div>
          </div>
          <textarea rows="10" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Job Description (min. 30 characters)" />
          <button type="submit">Post Job</button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
```

### frontend/src/components/Layout/Footer.jsx _(23 lines)_
```jsx
import React, { useContext } from 'react'
import {Context} from "../../main"
import {Link} from "react-router-dom"
import { FaGithub , FaLinkedin} from "react-icons/fa"
import { SiLeetcode } from "react-icons/si";
import { RiInstagramFill} from "react-icons/ri"
function Footer() {
  const {isAuthorized}  = useContext(Context)
  return (
    <footer className= {isAuthorized ? "footerShow" : "footerHide"}>
<div>&copy; All Rights Reserved by Abhishek.</div>
<div>
  <Link to={'https://github.com/exclusiveabhi'} target='github'><FaGithub></FaGithub></Link>
  <Link to={'https://leetcode.com/u/exclusiveabhi/'} target='leetcode'><SiLeetcode></SiLeetcode></Link>
  <Link to={'https://www.linkedin.com/in/abhishek-rajput-/'} target='linkedin'><FaLinkedin></FaLinkedin></Link>
  <Link to={'https://www.instagram.com/exclusiveabhi/'} target='instagram'><RiInstagramFill></RiInstagramFill></Link>
</div>
      
    </footer>
  )
}

export default Footer
```

### frontend/src/components/Layout/Navbar.jsx _(82 lines)_
```jsx
import React, { useContext, useState } from "react";
import { Context } from "../../main";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai"; // Import the close icon

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/v1/user/logout",
        {
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Logged out.");
    } finally {
      setUser({});
      setIsAuthorized(false);
      navigateTo("/login");
    }
  };

  return (
    <nav className={isAuthorized ? "navbarShow" : "navbarHide"}>
      <div className="container">
        <div className="logo">
          <img src="/careerconnect-white.png" alt="logo" />
        </div>
        <ul className={!show ? "menu" : "show-menu menu"}>
          <li>
            <Link to={"/"} onClick={() => setShow(false)}>
              HOME
            </Link>
          </li>
          <li>
            <Link to={"/job/getall"} onClick={() => setShow(false)}>
              ALL JOBS
            </Link>
          </li>
          <li>
            <Link to={"/applications/me"} onClick={() => setShow(false)}>
              {user && user.role === "Employer"
                ? "APPLICANT'S APPLICATIONS"
                : "MY APPLICATIONS"}
            </Link>
          </li>
          {user && user.role === "Employer" ? (
            <>
              <li>
                <Link to={"/job/post"} onClick={() => setShow(false)}>
                  POST NEW JOB
                </Link>
              </li>
              <li>
                <Link to={"/job/me"} onClick={() => setShow(false)}>
                  VIEW YOUR JOBS
                </Link>
              </li>
            </>
          ) : null}

          <button onClick={handleLogout}>LOGOUT</button>
        </ul>
        <div className="hamburger" onClick={() => setShow(!show)}>
          {show ? <AiOutlineClose /> : <GiHamburgerMenu />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

### frontend/src/components/NotFound/NotFound.jsx _(15 lines)_
```jsx
import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <section className="page notfound">
      <div className="content">
        <img src="/notfound.png" alt="Page not found" />
        <Link to="/">Return to Home</Link>
      </div>
    </section>
  );
};

export default NotFound;
```

### frontend/src/App.css _(812 lines)_
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow-x: hidden;
  font-family: "Inter", sans-serif;
}
::-webkit-scrollbar { display: none; }

:root {
  --primary: #4f46e5;
  --primary-dark: #3730a3;
  --primary-light: #eef2ff;
  --accent: #06b6d4;
  --dark: #0f172a;
  --gray: #64748b;
  --light-gray: #f1f5f9;
  --border: #e2e8f0;
  --white: #ffffff;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;
}

h1 { font-size: 3.8rem; font-weight: 800; }
h2 { font-size: 3.2rem; font-weight: 700; }
h3 { font-size: 2.4rem; font-weight: 700; }
h4 { font-size: 2rem; font-weight: 600; }
h5 { font-size: 1.8rem; }
h6 { font-size: 1.4rem; }
p  { font-size: 18px; }

@media (max-width: 1520px) {
  h1 { font-size: 3.2rem; }
  h2 { font-size: 2.8rem; }
  h3 { font-size: 2.2rem; }
}
@media (max-width: 768px) {
  h1 { font-size: 2.4rem; }
  h2 { font-size: 2rem; }
  h3 { font-size: 1.8rem; }
  h4 { font-size: 1.6rem; }
}

/* ─── AUTH ─── */
.authPage {
  display: flex;
  min-width: 1500px;
  max-width: 1500px;
  margin: 0 auto;
  min-height: 100vh;
}
.authPage .container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--white);
  padding: 40px 48px;
}
.authPage .container .header {
  text-align: center;
  margin-bottom: 36px;
}
.authPage .container .header .brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}
.authPage .container .header .brand-logo svg {
  font-size: 2rem;
  color: var(--primary);
}
.authPage .container .header .brand-logo span {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.5px;
}
.authPage .container .header h3 {
  font-size: 1.6rem;
  color: var(--dark);
  margin-bottom: 6px;
}
.authPage .container .header .auth-subtitle {
  font-size: 0.95rem;
  color: var(--gray);
}
.authPage .container form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.authPage .container form .inputTag {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.authPage .container form .inputTag label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dark);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.authPage .container form .inputTag div {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  overflow: hidden;
  height: 44px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.authPage .container form .inputTag div:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}
.authPage .container form .inputTag div input,
.authPage .container form .inputTag div select {
  background: var(--light-gray);
  padding: 10px 14px;
  border: none;
  width: 100%;
  height: 100%;
  font-size: 0.95rem;
  color: var(--dark);
}
.authPage .container form .inputTag div input:focus,
.authPage .container form .inputTag div select:focus { outline: none; background: var(--white); }
.authPage .container form .inputTag div > svg {
  flex-shrink: 0;
  width: 44px;
  font-size: 1.2rem;
  background: var(--primary);
  height: 100%;
  padding: 10px;
  color: var(--white);
}
.authPage .container form .inputTag div .eye-toggle {
  flex-shrink: 0;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  height: 100%;
  border: none;
  cursor: pointer;
  color: var(--white);
  font-size: 1.2rem;
  outline: none;
}
.authPage .container form .inputTag div .eye-toggle:hover { background: var(--primary-dark); }
.authPage .container form button[type="submit"] {
  padding: 13px;
  border: none;
  margin-top: 10px;
  font-weight: 700;
  color: var(--white);
  background: var(--primary);
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  letter-spacing: 0.3px;
}
.authPage .container form button[type="submit"]:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}
.authPage .container form button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
.authPage .container form a {
  padding: 12px;
  text-align: center;
  border: 1.5px solid var(--primary);
  font-weight: 600;
  color: var(--primary);
  font-size: 0.95rem;
  text-decoration: none;
  border-radius: 8px;
  display: block;
  transition: background 0.2s ease, color 0.2s ease;
}
.authPage .container form a:hover { background: var(--primary); color: var(--white); }
.authPage .banner {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--primary-light);
}
.authPage .banner img { width: 480px; height: 480px; object-fit: contain; }

@media (max-width: 1520px) { .authPage { min-width: 100%; } }
@media (max-width: 830px) {
  .authPage { min-height: 100vh; height: auto; }
  .authPage .container { flex: none; width: 100%; padding: 40px 24px; }
  .authPage .banner { display: none; }
}

/* ─── NAVBAR ─── */
.navbarHide { display: none; }
nav {
  background: var(--dark);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 12px rgba(0,0,0,0.2);
}
nav .container {
  max-width: 1400px;
  min-width: 0;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 68px;
}
nav .container .logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
nav .container .logo .nav-logo-icon {
  font-size: 1.5rem;
  color: var(--primary);
}
nav .container .logo .nav-brand {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--white);
  letter-spacing: -0.5px;
}
nav .menu {
  display: flex;
  gap: 28px;
  align-items: center;
  list-style: none;
}
nav .menu li a {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}
nav .menu li a:hover { color: var(--white); }
nav .menu button {
  padding: 8px 18px;
  border: 1.5px solid var(--primary);
  color: var(--white);
  background: var(--primary);
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.2s ease;
}
nav .menu button:hover { background: var(--primary-dark); border-color: var(--primary-dark); }
nav .hamburger { display: none; font-size: 28px; color: var(--white); cursor: pointer; }

@media (max-width: 1130px) {
  .page { padding-top: 68px; }
  nav .hamburger { display: block; }
  .menu {
    position: fixed;
    top: 68px;
    background: var(--dark);
    left: -100%;
    transition: left 0.3s ease;
    width: 300px;
    flex-direction: column;
    height: calc(100% - 68px);
    justify-content: center;
    gap: 28px;
    align-items: flex-start;
    padding-left: 28px;
  }
  nav .show-menu {
    left: 0;
    box-shadow: 4px 0 20px rgba(0,0,0,0.4);
  }
  nav .show-menu li a { color: #e2e8f0; font-size: 1.1rem; }
}
@media (max-width: 480px) { nav .menu { width: 100%; } }

/* ─── FOOTER ─── */
.footerHide { display: none; }
.footerShow {
  background: var(--dark);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 80px;
  flex-wrap: wrap;
  gap: 16px;
}
.footerShow .footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 800;
}
.footerShow .footer-brand .footer-logo-icon { color: var(--primary); font-size: 1.3rem; }
.footerShow .footer-copy { color: #94a3b8; font-size: 0.85rem; }
.footerShow .footer-links { display: flex; gap: 20px; }
.footerShow .footer-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}
.footerShow .footer-links a:hover { color: var(--white); }

@media (max-width: 768px) {
  .footerShow { padding: 20px 24px; flex-direction: column; text-align: center; gap: 12px; }
}

/* ─── HERO ─── */
.heroSection { display: flex; flex-direction: column; padding: 80px 0 60px; background: var(--white); }
.heroSection .container,
.heroSection .details {
  min-width: 1400px;
  max-width: 1400px;
  margin: 0 auto;
}
.heroSection .container {
  display: flex;
  height: 480px;
  margin-bottom: 2rem;
  gap: 40px;
  align-items: center;
}
.heroSection .container .title { flex: 1; display: flex; flex-direction: column; gap: 0; }
.heroSection .container .title h1 { color: var(--dark); line-height: 1.15; margin-bottom: 16px; }
.heroSection .container .title p { color: var(--gray); max-width: 520px; line-height: 1.6; margin-bottom: 28px; }
.heroSection .container .title .hero-actions { display: flex; gap: 14px; }
.hero-btn {
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}
.hero-btn.primary { background: var(--primary); color: var(--white); }
.hero-btn.primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(79,70,229,0.35); }
.hero-btn.secondary { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
.hero-btn.secondary:hover { background: var(--primary-light); }
.heroSection .container .image { flex: 1; overflow: hidden; border-radius: 16px; height: 100%; }
.heroSection .container .image img { width: 100%; height: 100%; object-fit: cover; }
.heroSection .details {
  display: flex;
  justify-content: space-between;
  padding: 40px 0;
  border-top: 1px solid var(--border);
}
.heroSection .details .card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 20px;
  border-radius: 10px;
  transition: box-shadow 0.2s ease;
}
.heroSection .details .card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.heroSection .details .card .icon {
  font-size: 22px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 10px;
  color: var(--primary);
}
.heroSection .details .card .content p:first-child { font-weight: 700; font-size: 1.2rem; color: var(--dark); }
.heroSection .details .card .content p:nth-child(2) { font-size: 13px; color: var(--gray); margin-top: 3px; }

@media (max-width: 1520px) {
  .heroSection .container, .heroSection .details { min-width: 100%; padding: 0 24px; }
  .heroSection .details { padding: 40px 24px; }
}
@media (max-width: 900px) {
  .heroSection .container { flex-direction: column-reverse; height: auto; padding: 24px; }
  .heroSection .container .image { width: 100%; height: 260px; }
  .heroSection .details { flex-wrap: wrap; gap: 20px; justify-content: center; }
}

/* ─── HOW IT WORKS ─── */
.howitworks { background: var(--light-gray); padding: 80px 0; }
.howitworks .container {
  max-width: 1400px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  align-items: center;
  padding: 0 24px;
  gap: 50px;
}
.howitworks .container h3 { color: var(--dark); }
.howitworks .container .banner { display: flex; justify-content: space-between; gap: 24px; width: 100%; }
.howitworks .container .banner .card {
  background: var(--white);
  display: flex;
  text-align: center;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 40px 36px;
  gap: 14px;
  border-radius: 14px;
  border: 1.5px solid var(--border);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.howitworks .container .banner .card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); transform: translateY(-3px); }
.howitworks .container .banner .card:nth-child(2) { background: var(--primary); border-color: var(--primary); color: var(--white); }
.howitworks .container .banner .card:nth-child(2) p:last-child { color: rgba(255,255,255,0.75); }
.howitworks .container .banner .card:nth-child(2) svg { color: var(--white); }
.howitworks .container .banner .card svg { font-size: 32px; color: var(--primary); }
.howitworks .container .banner .card p:first-of-type { font-size: 1.1rem; font-weight: 700; color: inherit; }
.howitworks .container .banner .card p:last-child { font-size: 14px; color: var(--gray); line-height: 1.6; }
@media (max-width: 850px) {
  .howitworks .container .banner { flex-wrap: wrap; justify-content: center; }
  .howitworks .container .banner .card { flex: none; width: 100%; max-width: 380px; }
}

/* ─── CATEGORIES ─── */
.categories {
  max-width: 1400px;
  min-width: 0;
  margin: 0 auto;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  gap: 36px;
}
.categories h3 { color: var(--dark); }
.categories .banner { display: flex; flex-wrap: wrap; gap: 20px; }
.categories .banner .card {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--light-gray);
  border-radius: 10px;
  border: 1.5px solid var(--border);
  width: 300px;
  transition: all 0.2s ease;
  cursor: pointer;
}
.categories .banner .card:hover { border-color: var(--primary); background: var(--primary-light); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(79,70,229,0.12); }
.categories .banner .card .icon { font-size: 22px; padding: 10px; background: var(--white); color: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.categories .banner .card .text p:nth-child(1) { font-size: 15px; font-weight: 600; color: var(--dark); }
.categories .banner .card .text p:nth-child(2) { font-size: 13px; color: var(--gray); margin-top: 3px; }
@media (max-width: 714px) { .categories { align-items: center; } .categories .banner { justify-content: center; } }

/* ─── COMPANIES ─── */
.companies { background: var(--light-gray); padding: 80px 0; }
.companies .container {
  max-width: 1400px;
  min-width: 0;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}
.companies .container h3 { color: var(--dark); }
.companies .container .banner { display: flex; justify-content: space-between; width: 100%; gap: 24px; }
.companies .container .banner .card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--white);
  padding: 24px;
  gap: 16px;
  border-radius: 14px;
  border: 1.5px solid var(--border);
  transition: all 0.2s ease;
}
.companies .container .banner .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
.companies .container .banner .card .content { display: flex; align-items: center; gap: 14px; }
.companies .container .banner .card .content .icon { padding: 12px; font-size: 24px; color: var(--primary); background: var(--primary-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.companies .container .banner .card .content .text p:first-child { font-weight: 700; font-size: 1rem; color: var(--dark); }
.companies .container .banner .card .content .text p:last-child { font-size: 13px; color: var(--gray); margin-top: 3px; }
.companies .container .banner .card button {
  color: var(--primary);
  background: var(--primary-light);
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  padding: 9px 0;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.companies .container .banner .card button:hover { background: var(--primary); color: var(--white); }
@media (max-width: 1000px) { .companies .container .banner { flex-direction: column; align-items: center; } .companies .container .banner .card { width: 100%; max-width: 400px; } }

/* ─── JOBS ─── */
.jobs { background: var(--light-gray); min-height: 100vh; padding: 60px 24px; }
.jobs .container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  gap: 36px;
}
.jobs .container h1 { color: var(--dark); }
.jobs .container .banner { display: flex; flex-wrap: wrap; width: 100%; gap: 20px; justify-content: center; }
.jobs .container .banner .card {
  background: var(--white);
  width: 300px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  transition: all 0.2s ease;
}
.jobs .container .banner .card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: var(--primary); }
.jobs .container .banner .card p:first-child { font-weight: 700; font-size: 1.1rem; color: var(--dark); }
.jobs .container .banner .card p:nth-child(2) { font-size: 0.9rem; color: var(--primary); font-weight: 500; }
.jobs .container .banner .card p:last-child { font-size: 0.85rem; color: var(--gray); }
.jobs .container .banner .card a {
  text-decoration: none;
  padding: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-light);
  border-radius: 7px;
  display: block;
  text-align: center;
  margin-top: 4px;
  transition: all 0.2s ease;
}
.jobs .container .banner .card a:hover { background: var(--primary); color: var(--white); }

/* ─── JOB DETAIL ─── */
.jobDetail { background: var(--light-gray); padding: 60px 24px; min-height: 100vh; }
.jobDetail .container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
.jobDetail .container h3 { color: var(--dark); margin-bottom: 28px; }
.jobDetail .container .banner {
  background: var(--white);
  border-radius: 14px;
  border: 1.5px solid var(--border);
  padding: 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.jobDetail .container .banner p { font-weight: 600; color: var(--primary); font-size: 1rem; }
.jobDetail .container .banner p span { color: var(--dark); font-weight: 400; margin-left: 8px; }
.jobDetail .container .banner a {
  background: var(--primary);
  color: var(--white);
  font-size: 1rem;
  font-weight: 600;
  border: none;
  padding: 13px 30px;
  text-decoration: none;
  border-radius: 8px;
  margin-top: 8px;
  width: fit-content;
  transition: background 0.2s ease;
}
.jobDetail .container .banner a:hover { background: var(--primary-dark); }

/* ─── APPLICATION ─── */
.application { background: var(--light-gray); min-height: 100vh; padding: 60px 24px; }
.application .container { max-width: 700px; margin: 0 auto; }
.application .container h3 { color: var(--dark); margin-bottom: 28px; }
.application .container form {
  background: var(--white);
  border-radius: 14px;
  border: 1.5px solid var(--border);
  padding: 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.application .container form input,
.application .container form textarea {
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  padding: 12px 14px;
  width: 100%;
  color: var(--dark);
  background: var(--light-gray);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.application .container form input:focus,
.application .container form textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
  background: var(--white);
}
.application .container form textarea { height: 160px; resize: vertical; }
.application .container form button {
  background: var(--primary);
  color: var(--white);
  font-size: 1rem;
  font-weight: 600;
  border: none;
  padding: 13px 30px;
  border-radius: 8px;
  width: 100%;
  cursor: pointer;
  transition: background 0.2s ease;
}
.application .container form button:hover:not(:disabled) { background: var(--primary-dark); }

/* ─── MY APPLICATIONS ─── */
.my_applications { background: var(--light-gray); padding: 60px 24px; min-height: 100vh; }
.my_applications .container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 30px; }
.my_applications .container h1 { color: var(--dark); }
.job_seeker_card {
  display: flex;
  align-items: center;
  background: var(--white);
  border-radius: 12px;
  border: 1.5px solid var(--border);
  padding: 24px;
  gap: 24px;
  transition: box-shadow 0.2s ease;
}
.job_seeker_card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
.job_seeker_card .detail { flex: 2; display: flex; flex-direction: column; gap: 8px; }
.job_seeker_card .detail p { font-size: 0.95rem; color: var(--dark); }
.job_seeker_card .detail span { font-weight: 600; color: var(--primary); margin-right: 6px; }
.job_seeker_card .resume { flex: 1; position: relative; height: 220px; }
.job_seeker_card .resume img { width: auto; height: 100%; position: absolute; top: 0; left: 0; border-radius: 8px; cursor: pointer; border: 1px solid var(--border); }
.job_seeker_card .btn_area { flex: 1; display: flex; align-items: center; justify-content: center; }
.job_seeker_card .btn_area button {
  background: var(--danger);
  color: var(--white);
  border: none;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.job_seeker_card .btn_area button:hover { opacity: 0.85; }

@media (max-width: 900px) {
  .job_seeker_card { flex-direction: column; align-items: flex-start; }
  .job_seeker_card .resume { flex: none; width: 100%; height: 220px; }
}

/* ─── POST JOB ─── */
.job_post { background: var(--light-gray); padding: 60px 24px; min-height: 100vh; }
.job_post .container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }
.job_post .container h3 { color: var(--dark); }
.job_post .container form {
  background: var(--white);
  border-radius: 14px;
  border: 1.5px solid var(--border);
  padding: 36px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.job_post .container form .wrapper { display: flex; gap: 20px; }
.job_post .container form .wrapper input,
.job_post .container form .wrapper select,
.job_post .container form input,
.job_post .container form textarea {
  flex: 1;
  font-size: 0.95rem;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: var(--light-gray);
  color: var(--dark);
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.job_post .container form .wrapper input:focus,
.job_post .container form .wrapper select:focus,
.job_post .container form input:focus,
.job_post .container form textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
  background: var(--white);
}
.job_post .container form .salary_wrapper { display: flex; flex-direction: column; gap: 12px; }
.job_post .container form .salary_wrapper p { color: var(--danger); font-size: 0.85rem; }
.job_post .container form .salary_wrapper select { width: fit-content; }
.job_post .container form .salary_wrapper .ranged_salary { display: flex; gap: 20px; }
.job_post .container form button {
  width: 100%;
  background: var(--primary);
  font-size: 1rem;
  font-weight: 700;
  padding: 13px 30px;
  border: none;
  color: var(--white);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.job_post .container form button:hover { background: var(--primary-dark); }
@media (max-width: 640px) {
  .job_post .container form .wrapper,
  .job_post .container form .salary_wrapper .ranged_salary { flex-direction: column; gap: 14px; }
}

/* ─── MY JOBS ─── */
.myJobs { background: var(--light-gray); padding: 60px 24px; min-height: 100vh; }
.myJobs .container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }
.myJobs .container h1 { color: var(--dark); }
.myJobs .container .banner { width: 100%; display: flex; flex-wrap: wrap; gap: 20px; flex-direction: column; }
.myJobs .container .banner .card {
  width: 100%;
  display: flex;
  gap: 20px;
  background: var(--white);
  border-radius: 12px;
  border: 1.5px solid var(--border);
  padding: 24px;
}
.myJobs .container .banner .card .content { flex: 3; display: flex; gap: 20px; }
.myJobs .container .banner .card .content span { font-size: 0.9rem; margin-right: 6px; font-weight: 600; color: var(--primary); }
.myJobs .container .banner .card .content input,
.myJobs .container .banner .card .content select { background: transparent; font-size: 0.9rem; border: none; color: var(--dark); padding: 6px 4px; }
.myJobs .container .banner .card .content input:enabled,
.myJobs .container .banner .card .content select:enabled { border-bottom: 1.5px solid var(--primary); }
.myJobs .container .banner .card .content input:disabled,
.myJobs .container .banner .card .content select:disabled { color: var(--gray); }
.myJobs .container .banner .card .content input:focus,
.myJobs .container .banner .card .content select:focus { outline: none; }
.myJobs .container .banner .card .content .short_fields { flex: 1; display: flex; flex-direction: column; gap: 18px; }
.myJobs .container .banner .card .content .long_field { flex: 2; display: flex; flex-direction: column; gap: 18px; }
.myJobs .container .banner .card .content .short_fields div,
.myJobs .container .banner .card .content .long_field div { display: flex; flex-direction: column; gap: 8px; }
.myJobs .container .banner .card .content .short_fields div div { flex-direction: row; gap: 10px; }
.myJobs .container .banner .card .content .long_field textarea {
  background: transparent; font-size: 0.9rem; color: var(--dark); border: none; padding: 6px 4px; height: fit-content; resize: vertical;
}
.myJobs .container .banner .card .content .long_field textarea:disabled { color: var(--gray); }
.myJobs .container .banner .card .content .long_field textarea:enabled { border-bottom: 1.5px solid var(--primary); }
.myJobs .container .banner .card .content .long_field textarea:focus { outline: none; }
.myJobs .container .banner .card .button_wrapper {
  flex: 1; display: flex; flex-direction: column; gap: 14px; align-items: center; justify-content: center;
}
.myJobs .container .banner .card .button_wrapper .edit_btn,
.myJobs .container .banner .card .button_wrapper .delete_btn {
  width: 110px; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; padding: 9px; border: none; border-radius: 7px; cursor: pointer; transition: opacity 0.2s ease;
}
.myJobs .container .banner .card .button_wrapper .edit_btn { background: var(--warning); color: var(--dark); }
.myJobs .container .banner .card .button_wrapper .delete_btn { background: var(--danger); color: var(--white); }
.myJobs .container .banner .card .button_wrapper .edit_btn:hover,
.myJobs .container .banner .card .button_wrapper .delete_btn:hover { opacity: 0.85; }
.myJobs .container .banner .card .button_wrapper .check_btn {
  background: transparent; color: var(--success); border: 1.5px solid var(--success); border-radius: 7px; width: 46px; padding: 8px;
  display: flex; justify-content: center; align-items: center; font-size: 18px; cursor: pointer; transition: all 0.2s ease;
}
.myJobs .container .banner .card .button_wrapper .check_btn:hover { background: var(--success); color: var(--white); }
.myJobs .container .banner .card .button_wrapper .cross_btn {
  background: transparent; color: var(--danger); border: 1.5px solid var(--danger); border-radius: 7px; width: 46px; padding: 8px;
  display: flex; justify-content: center; align-items: center; font-size: 18px; cursor: pointer; transition: all 0.2s ease;
}
.myJobs .container .banner .card .button_wrapper .cross_btn:hover { background: var(--danger); color: var(--white); }
.myJobs .container .banner .card .button_wrapper .edit_btn_wrapper { gap: 12px; display: flex; }

@media (max-width: 830px) {
  .myJobs .container .banner .card { flex-direction: column; }
  .myJobs .container .banner .card .content { flex-direction: column; }
}

/* ─── NOT FOUND ─── */
.notfound { min-height: 80vh; display: flex; align-items: center; justify-content: center; }
.notfound .content { display: flex; flex-direction: column; align-items: center; gap: 24px; }
.notfound .content a {
  font-size: 1rem; font-weight: 600; padding: 12px 28px; background: var(--primary); color: var(--white);
  text-decoration: none; border-radius: 8px; transition: background 0.2s ease;
}
.notfound .content a:hover { background: var(--primary-dark); }

/* ─── RESUME MODAL ─── */
.resume-modal {
  width: 100%; display: flex; background: rgba(0,0,0,0.75); height: 100%; position: fixed; top: 0; left: 0; z-index: 200;
}
.resume-modal .modal-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
.resume-modal .modal-content .close {
  position: absolute; right: 32px; top: 28px; font-size: 44px; color: var(--white); cursor: pointer; line-height: 1;
  transition: color 0.2s ease;
}
.resume-modal .modal-content .close:hover { color: var(--danger); }
.resume-modal .modal-content img { max-width: 560px; height: auto; border-radius: 12px; border: 3px solid var(--white); }
@media (max-width: 600px) { .resume-modal .modal-content img { max-width: 90vw; } }
```

### frontend/src/App.jsx _(64 lines)_
```jsx
import React, { useContext, useEffect } from "react";
import "./App.css";
import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Home from "./components/Home/Home";
import Jobs from "./components/Job/Jobs";
import JobDetails from "./components/Job/JobDetails";
import Application from "./components/Application/Application";
import MyApplications from "./components/Application/MyApplications";
import PostJob from "./components/Job/PostJob";
import NotFound from "./components/NotFound/NotFound";
import MyJobs from "./components/Job/MyJobs";

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/getuser`,
          {
            withCredentials: true,
          }
        );
        setUser(response.data.user);
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/job/getall" element={<Jobs />} />
          <Route path="/job/:id" element={<JobDetails />} />
          <Route path="/application/:id" element={<Application />} />
          <Route path="/applications/me" element={<MyApplications />} />
          <Route path="/job/post" element={<PostJob />} />
          <Route path="/job/me" element={<MyJobs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </>
  );
};

export default App;
```

### frontend/src/main.jsx _(32 lines)_
```jsx
import React, { createContext, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

export const Context = createContext({
  isAuthorized: false,
});

const AppWrapper = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState({});

  return (
    <Context.Provider
      value={{
        isAuthorized,
        setIsAuthorized,
        user,
        setUser,
      }}
    >
      <App />
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
```

### frontend/index.html _(13 lines)_
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CareerConnect: Find Top Talent and Hire the Best</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### frontend/package.json _(31 lines)_
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^4.12.0",
    "react-router-dom": "^6.21.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.0.8"
  }
}
```

### frontend/vite.config.js _(8 lines)_
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

### README.md _(90 lines)_
```markdown
# JobHive — Job Portal (MERN Stack)

A full-stack job portal built with MongoDB, Express, React, and Node.js.
Resumes are stored **locally** on the server — no Cloudinary or third-party file storage needed.

---

## Prerequisites

- Node.js v18+
- MongoDB running locally (`mongod`)

---

## Setup

### 1. Clone / extract the project

### 2. Backend

```bash
cd backend
npm install
```

The config file is at `backend/config/config.env` — edit if needed:

```env
PORT=4000
DB_URL=mongodb://127.0.0.1:27017
JWT_SECRET_KEY=yourSuperSecretKey123
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev       # with nodemon (auto-restart)
# or
node server.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

---

## Features

- JWT authentication (Job Seeker & Employer roles)
- Post, edit, delete jobs (Employer)
- Browse and apply for jobs (Job Seeker)
- Resume upload stored locally in `backend/uploads/`
- View/manage applications
- Responsive design

---

## Project Structure

```
job-portal/
├── backend/
│   ├── config/config.env       ← environment variables
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── uploads/                ← resume images saved here
│   ├── utils/
│   ├── app.js
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── .env                    ← VITE_API_URL
    └── index.html
```
```

---

## 🐛 Errors

> Auto-scanned: 6/15/2026, 11:49:45 AM

✅ No errors found!
