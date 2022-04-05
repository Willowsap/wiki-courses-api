import GitService from "./git.service";
import Course, { ClientCourse, ICourse } from "../models/course.model";
import path from "path";
import { LinkedFileList, FileData } from "./linked-file-list.service";
import { ClientTopic } from "../models/client-topic.model";
import fs, { fstat } from "fs";

export default class CourseDatabaseService {
  private repoFolder = path.resolve(__dirname, "../../db");
  private dbLists: { [key: string]: LinkedFileList } = {};
  private initialFile = "Description";

  private getRepoName(title: string) {
    return this.repoFolder + "/" + title.split(" ").join("-");
  }

  private getFileName(title: string) {
    return title;
  }

  private addNewTopicList(
    folder: string,
    rootFileName: string,
    rootFileContents: string
  ) {
    this.dbLists[folder] = new LinkedFileList({
      folder,
      rootFileName,
      rootFileContents,
    });
  }

  rebuildTopicList(folder: string) {
    if (!fs.existsSync(folder)) {
      return false;
    } else {
      this.dbLists[folder] = LinkedFileList.constructFromFolder(folder);
      return true;
    }
  }

  async createCourse({
    courseTitle,
    email,
    username,
  }: {
    courseTitle: string;
    email: string;
    username: string;
  }): Promise<ClientCourse> {
    const courseExists = await Course.findOne({ title: courseTitle });
    if (courseExists) {
      throw new Error("course already exists");
    }
    const repo = this.getRepoName(courseTitle);
    await GitService.init(repo);
    const course: ICourse = new Course({
      title: courseTitle,
      repo,
    });
    const createdCourse = await course.save();
    if (!createdCourse) {
      GitService.deleteRepo(repo);
      throw new Error("could not save course");
    }
    const initialContents = `<p>Description for ${createdCourse.title}</p>`;
    this.addNewTopicList(repo, this.initialFile, initialContents);
    await GitService.add({
      repo: createdCourse.repo,
      commit: true,
      email,
      username,
      message: "initial commit",
    });
    return { title: courseTitle, description: initialContents };
  }

  async createTopic({
    courseTitle,
    topicTitle,
    topicContents,
    email,
    username,
  }: {
    courseTitle: string;
    topicTitle: string;
    topicContents: string;
    email: string;
    username: string;
  }): Promise<ClientTopic> {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      this.dbLists[course.repo].appendFile({
        fileName: this.getFileName(topicTitle),
        fileContents: topicContents,
      });
      await GitService.add({
        repo: course.repo,
        commit: true,
        email,
        username,
        message: `created topic ${topicTitle}`,
      });
      return { title: topicTitle, contents: topicContents };
    }
  }

  async getCourse({
    courseTitle,
  }: {
    courseTitle: string;
  }): Promise<ClientCourse> {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      const result = this.dbLists[course.repo].getFile(this.initialFile);
      if (result === null) {
        throw new Error("could not find course description");
      } else {
        return {
          title: course.title,
          description: result.contents,
        };
      }
    }
  }

  getCourseByRepo({
    courseTitle,
    courseRepo,
  }: {
    courseTitle: string;
    courseRepo: string;
  }): ClientCourse {
    if (!this.dbLists[courseRepo]) {
      const r = this.rebuildTopicList(courseRepo);
      if (!r) {
        return {
          title: "error",
          description: "error"
        }
      }
    }
    const result = this.dbLists[courseRepo].getFile(this.initialFile);
    console.log(result)
    if (result === null) {
      return {
        title: "error",
        description: "error"
      }
    } else {
      return {
        title: courseTitle,
        description: result.contents,
      };
    }
  }

  async getTopic({
    courseTitle,
    topicTitle,
  }: {
    courseTitle: string;
    topicTitle: string;
  }): Promise<FileData> {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      const result = this.dbLists[course.repo].getFile(
        this.getFileName(topicTitle)
      );
      if (result === null) {
        throw new Error("could not find topic");
      } else {
        return result;
      }
    }
  }

  async getTopics({
    courseTitle,
  }: {
    courseTitle: string;
  }): Promise<Array<FileData>> {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      const result = this.dbLists[course.repo].getAllFiles();
      if (result === null) {
        throw new Error("could not find topics");
      } else {
        return result;
      }
    }
  }

  async updateCourseTitle({
    oldTitle,
    newTitle,
  }: {
    oldTitle: string;
    newTitle: string;
  }) {
    return Course.updateOne({ title: oldTitle }, { title: newTitle });
  }

  async updateCourseDescription({
    courseTitle,
    newDescription,
    email,
    username,
    message,
  }: {
    courseTitle: string;
    newDescription: string;
    email: string;
    username: string;
    message: string;
  }) {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      console.log("failed to update description");
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      this.dbLists[course.repo].updateFileContents(
        this.initialFile,
        newDescription
      );
      await GitService.add({
        repo: course.repo,
        commit: true,
        email,
        username,
        message,
      });
    }
  }

  async updateTopicTitle({
    courseTitle,
    oldTitle,
    newTitle,
    email,
    username,
    message,
  }: {
    courseTitle: string;
    oldTitle: string;
    newTitle: string;
    email: string;
    username: string;
    message: string;
  }) {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      this.dbLists[course.repo].renameFile(oldTitle, newTitle);
      await GitService.add({
        repo: course.repo,
        commit: true,
        email,
        username,
        message,
      });
    }
  }

  async updateTopicContents({
    courseTitle,
    topicTitle,
    newContents,
    email,
    username,
    message,
  }: {
    courseTitle: string;
    topicTitle: string;
    newContents: string;
    email: string;
    username: string;
    message: string;
  }) {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      this.dbLists[course.repo].updateFileContents(topicTitle, newContents);
      await GitService.add({
        repo: course.repo,
        commit: true,
        email,
        username,
        message,
      });
    }
  }

  async deleteCourse({ courseTitle }: { courseTitle: string }) {
    return Course.deleteOne({ title: courseTitle });
  }

  async deleteTopic({
    courseTitle,
    topicTitle,
    email,
    username,
    message,
  }: {
    courseTitle: string;
    topicTitle: string;
    email: string;
    username: string;
    message: string;
  }) {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      if (!this.dbLists[course.repo]) {
        this.rebuildTopicList(course.repo);
      }
      this.dbLists[course.repo].deleteFile(topicTitle);
      await GitService.add({
        repo: course.repo,
        commit: true,
        email,
        username,
        message,
      });
    }
  }

  async revertCourse({
    courseTitle,
    oid,
    message
  }: {
    courseTitle: string,
    oid: string,
    message: string
  }) {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      throw new Error("could not find course");
    } else {
      const success = await GitService.revertCourse({repo: course.repo, oid, message});
      if (success) {
        this.rebuildTopicList(course.repo);
        return true;
      } else {
        return false;
      }
    }
  }
}
