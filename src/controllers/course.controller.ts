import Course, { ClientCourse, ICourse } from "../models/course.model";
import { NextFunction, Request, Response } from "express";
import CourseDatabaseService from "../services/course-database.service";
import GitService from "../services/git.service";

export default class CourseController {
  private courseDatabaseService;

  constructor(cdbs: CourseDatabaseService) {
    this.courseDatabaseService = cdbs;
  }

  /****************************************************************************
   ***************************  GETTING FUNCTIONS  ****************************
   ****************************************************************************/

  /*
   * Expects query with:
   *    page
   *    pageSize
   *    query
   */
  getAllCourseStubs = (req: Request, res: Response, next: NextFunction) => {
    const pageSize = parseInt(req.query.pageSize as string);
    const currentPage = parseInt(req.query.page as string);
    const query = req.query.query as string;
    let courseQuery = Course.find({
      title: { $regex: new RegExp(query, "i") },
    });
    let fetchedCourses: ICourse[];
    if (pageSize && currentPage && !query) {
      courseQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
    }
    courseQuery
      .then((documents: ICourse[]) => {
        if (query) {
          fetchedCourses = documents.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize > documents.length
              ? documents.length
              : currentPage * pageSize
          );
          return documents.length;
        } else {
          fetchedCourses = documents;
          return Course.countDocuments();
        }
      })
      .then((count) => {
        const c: Array<ClientCourse> = [];
        for(let i = 0; i < fetchedCourses.length; i++) {
          const d = this.courseDatabaseService.getCourseByRepo({
            courseTitle: fetchedCourses[i].title,
            courseRepo: fetchedCourses[i].repo
          });
          if (d.title === "error") {
            count--;
          } else {
            c.push(d);
          }
        }
        res.status(200).json({
          message: "Courses successfully fetched",
          courses: c,
          maxCourses: count,
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Fetching courses failed!" });
      });
  };

  /*
   * Expects params with:
   *    courseTitle
   */
  getCourse = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.params.courseTitle);
    this.courseDatabaseService
      .getCourse({ courseTitle: req.params.courseTitle as string })
      .then((course) => {
        res.status(200).json(course);
      })
      .catch((error) => {
        res.status(404).json("Could not find course");
      });
  };

  /*
   * Expects params with:
   *    courseTitle
   */
  getTopics = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .getTopics({ courseTitle: req.params.courseTitle as string })
      .then((topics) => {
        res.status(200).json(topics);
      })
      .catch((error) => {
        res.status(404).json("Could not find topics");
      });
  };

  /*
   * Expects params with:
   *    courseTitle
   *    topicTitle
   */
  getTopic = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .getTopic({
        courseTitle: req.params.courseTitle as string,
        topicTitle: req.params.topicTitle as string,
      })
      .then((topic) => {
        res.status(200).json(topic);
      })
      .catch((error) => {
        res.status(404).json("Could not find topic");
      });
  };

  /****************************************************************************
   ***************************  CREATION FUNCTIONS  ***************************
   ****************************************************************************/

  /*
   * Expects body with:
   *    courseTitle
   *    email
   *    username
   */
  createCourse = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .createCourse({
        courseTitle: req.body.courseTitle as string,
        email: req.body.email as string,
        username: req.body.username as string,
      })
      .then((createdCourse) => {
        res.status(201).json(createdCourse);
      })
      .catch((error) => {
        console.log(error);
        res.status(400).json({ message: "unable to create course" });
      });
  };

  /*
   * Expects params with:
   *    courseTitle
   *
   * Expects body with:
   *    topicTitle
   *    email
   *    username
   */
  createTopic = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .createTopic({
        courseTitle: req.params.courseTitle as string,
        topicTitle: req.body.topicTitle as string,
        topicContents: "<p>new topic</p>",
        email: req.body.email as string,
        username: req.body.username as string,
      })
      .then((createdTopic) => {
        res.status(201).json(createdTopic);
      })
      .catch((error) => {
        res.status(400).json({ message: "unable to create topic" });
      });
  };

  /****************************************************************************
   ***************************  EDITING FUNCTIONS  ****************************
   ****************************************************************************/

  /*
   * Expects params with:
   *    courseTitle
   *
   * Expects body with:
   *    newCourseTitle
   */
  updateCourseTitle = (req: Request, res: Response, next: NextFunction) => {
    console.log("updating course title")
    console.log(req.params.courseTitle);
    console.log(req.body.newCourseTitle);
    if (!req.body.newCourseTitle) {
      res.status(400).json({ message: "requires new course title" });
    } else {
      this.courseDatabaseService
        .updateCourseTitle({
          oldTitle: req.params.courseTitle as string,
          newTitle: req.body.newCourseTitle as string,
        })
        .then(() => {
          res.status(200).json({ message: "success" });
        })
        .catch((error) => {
          res.status(400).json({ message: "failed to update course title" });
        });
    }
  };

  /*
   * Expects params with:
   *    courseTitle
   *
   * Expects body with:
   *    description
   *    email
   *    username
   *    message
   */
  updateCourseDescription = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.courseDatabaseService
      .updateCourseDescription({
        courseTitle: req.params.courseTitle as string,
        newDescription: req.body.description as string,
        email: req.body.email as string,
        username: req.body.username as string,
        message: req.body.message as string,
      })
      .then(() => {
        res.status(200).json({ message: "success" });
      })
      .catch((error) => {
        res.status(400).json({ message: "failed to update course description" });
      });
  };

  /*
   * Expects params with:
   *    courseTitle
   *    topicTitle
   *
   * Expects body with:
   *    newTopicTitle
   *    email
   *    username
   *    message
   */
  updateTopicTitle = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .updateTopicTitle({
        courseTitle: req.params.courseTitle as string,
        oldTitle: req.params.topicTitle as string,
        newTitle: req.body.newTopicTitle as string,
        email: req.body.email as string,
        username: req.body.username as string,
        message: req.body.message as string,
      })
      .then(() => {
        res.status(200).json({ message: "success" });
      })
      .catch((error) => {
        res.status(400).json({ message: "failed to update topic title" });
      });
  };

  /*
   * Expects params with:
   *    courseTitle
   *    topicTitle
   *
   * Expects body with:
   *    contents
   *    email
   *    username
   *    message
   */
  updateTopicContent = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .updateTopicContents({
        courseTitle: req.params.courseTitle as string,
        topicTitle: req.params.topicTitle as string,
        newContents: req.body.contents as string,
        email: req.body.email as string,
        username: req.body.username as string,
        message: req.body.message as string,
      })
      .then(() => {
        res.status(200).json({ message: "success" });
      })
      .catch((error) => {
        res.status(400).json({ message: "failed to update topic contents" });
      });
  };

  /****************************************************************************
   ***************************  DELETION FUNCTIONS  ***************************
   ****************************************************************************/

  /*
   * Expects params with:
   *    courseTitle
   */
  deleteCourse = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .deleteCourse({ courseTitle: req.params.courseTitle as string })
      .then(() => {
        res.status(200).json({ message: "success" });
      })
      .catch((error) => {
        res.status(400).json({ message: "failed to delete course" });
      });
  };

  /*
   * Expects params with:
   *    courseTitle
   *    topicTitle
   *
   * Expects body with:
   *    content
   *    email
   *    username
   *    message
   */
  deleteTopic = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService
      .deleteTopic({
        courseTitle: req.params.courseTitle as string,
        topicTitle: req.params.topicTitle as string,
        email: req.body.email as string,
        username: req.body.username as string,
        message: req.body.message as string,
      })
      .then(() => {
        res.status(200).json({ message: "success" });
      })
      .catch((error) => {
        res.status(400).json({ message: "failed to delete topic" });
      });
  };

  /****************************************************************************
   ***************************  VERSION FUNCTIONS  ****************************
   ****************************************************************************/

  /*
   * Expects params with:
   *    courseTitle
   *
   * Expects query with:
   *    depth
   */
  getCourseVersions(req: Request, res: Response, next: NextFunction) {
    Course.findOne({title: req.params.courseTitle}).then(course => {
      if (course) {
        console.log(course);
        GitService.getCommitHistory({
          repo: course.repo,
          depth: 10 
        }).then(commits => {
          res.status(200).json(commits);
        }).catch(error => {
          console.log(error);
          res.status(500).json({message: "Failed to get versions"});
        })
      } else {
        res.status(404).json({message: "could not find course"})
      }
    });
  }

  /*
   * Expects params with:
   *    courseTitle
   *
   * Expects body with:
   *    oid
   */
  revertCourse = (req: Request, res: Response, next: NextFunction) => {
    this.courseDatabaseService.revertCourse({
      courseTitle: req.params.courseTitle,
      oid: req.body.oid
    }).then(result => {
      if (result) {
        res.status(200).json({message: "successfully reverted"});
      } else {
        res.status(500).json({message: "failed to revert course"});
      }
    })
  }
}