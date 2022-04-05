import git from "isomorphic-git";
import fs from "fs";
import UtilService from "./util.service";

export default class GitService {
  public static init = async (dir: string) => {
    UtilService.forceMkdir(dir);
    await git.init({ fs, dir });
  };

  public static add = async ({
    repo,
    commit,
    email,
    username,
    message,
  }: {
    repo: string;
    commit: boolean;
    username: string;
    email: string;
    message: string;
  }) => {
    await git.add({ fs, dir: repo, filepath: "." });
    if (commit) {
      await this.commit({
        repo,
        username,
        email,
        message,
      });
    }
    return { message: "success" };
  };

  public static commit = async ({
    repo,
    username,
    email,
    message,
  }: {
    repo: string;
    username: string;
    email: string;
    message: string;
  }) => {
    await git.commit({
      fs,
      dir: repo,
      author: {
        name: username,
        email,
      },
      message,
    });
  };

  public static getTopic = (repo: string, topicTitle: string) => {
    return UtilService.getFileContents(repo + topicTitle);
  };

  public static getTopics = (repo: string) => {
    const topics: Topic[] = [];
    const filenames = fs.readdirSync(repo);
    filenames.forEach((file) => {
      if (file.includes(".html")) {
        topics.push({
          title: file.slice(0, -5),
          content: UtilService.getFileContents(repo + file),
        });
      }
    });
    return topics;
  };

  public static deleteRepo = (repo: string) => {
    UtilService.removeDir(repo);
  };

  public static revertCourse = async ({
    repo,
    oid,
    message
  }: {
    repo: string;
    oid: string;
    message: string;
  }): Promise<boolean> => {
    await git.checkout({
      fs,
      dir: repo,
      ref: oid
    });
    fs.writeFile(repo + `/.git/refs/heads/master`, oid, (err) => {
        // clear the index (if any)
        fs.unlink(repo + '/.git/index', (err2) => {
          // checkout the branch into the working tree
          git.checkout({ dir: repo, fs, ref: "master" })
            .then(() => {
              // Done! (in theory, haven't tested it)
            });
        })
      });
    return true;
  };

  public static getCommitHistory = async ({
    repo,
    depth,
  }: {
    repo: string;
    depth: number;
  }) => {
    let commits = await git.log({
      fs,
      dir: repo,
      depth,
      ref: "master",
    });
    return commits;
  };
}

interface Topic {
  title: string;
  content: string;
}
