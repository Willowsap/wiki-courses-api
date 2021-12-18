import express from "express";
import checkAuth from "../middleware/check-auth";
import CourseController from "../controllers/course.controller";
import CourseDatabaseService from "../services/course-database.service";

const router = express.Router();
const courseController = new CourseController(new CourseDatabaseService());

// Get
router.get("", courseController.getAllCourseStubs);
router.get("/:courseTitle", courseController.getCourse);
router.get("/:courseTitle/topics", courseController.getTopics);
router.get("/:courseTitle/topics/:topicTitle", courseController.getTopic);

// Create
router.post("", checkAuth, courseController.createCourse);
router.post("/:courseTitle/topics", checkAuth, courseController.createTopic);

// Edit
router.put(
  "/:courseTitle/title",
  checkAuth,
  courseController.updateCourseTitle
);
router.put(
  "/:courseTitle/description",
  checkAuth,
  courseController.updateCourseDescription
);
router.put(
  "/:courseTitle/topics/:topicTitle/title",
  checkAuth,
  courseController.updateTopicTitle
);
router.put(
  "/:courseTitle/topics/:topicTitle/contents",
  checkAuth,
  courseController.updateTopicContent
);

// Delete
router.delete("/:courseTitle", checkAuth, courseController.deleteCourse);
router.delete(
  "/:courseTitle/topics/:topicTitle",
  checkAuth,
  courseController.deleteTopic
);

// Version Control
router.get(
  "/versions/:courseTitle",
  checkAuth,
  courseController.getCourseVersions
);
router.put("/versions/:courseTitle", checkAuth, courseController.revertCourse);

export default router;
