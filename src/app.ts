import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import mongoose from "mongoose";
import courseRoutes from "./routes/course";
import userRoutes from "./routes/user";
// mongodb+srv://sapphire:793pQD6wDixN9vSQ@cluster0.fmdcl.mongodb.net/test

mongoose
  .connect(
    "mongodb+srv://sapphire:793pQD6wDixN9vSQ@cluster0.fmdcl.mongodb.net/wikicourses?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }
  )
  .then(() => {
    console.log("connected to database!");
  })
  .catch(() => {
    console.log("failed to connect to database");
  });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/images", express.static(path.join("backend/images")));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/api/user", userRoutes);
app.use("/api/courses", courseRoutes);

export default app;
