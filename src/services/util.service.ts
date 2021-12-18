import fs from "fs";
import fse from "fs-extra";

export default class UtilService {
  public static getFormattedDate(date: Date) {
    return (
      date.getMonth() +
      "/" +
      date.getDay() +
      "/" +
      date.getFullYear() +
      ", " +
      (date.getHours() < 10 ? "0" : "") +
      date.getHours() +
      ":" +
      (date.getMinutes() < 10 ? "0" : "") +
      date.getMinutes() +
      ":" +
      (date.getSeconds() < 10 ? "0" : "") +
      date.getSeconds()
    );
  }

  public static removeDir(dir: string) {
    if (fs.existsSync(dir)) {
      fs.rmdirSync(dir, { recursive: true });
    }
  }

  public static forceMkdir(dir: string) {
    this.removeDir(dir);
    fs.mkdirSync(dir);
  }

  public static copyDir(srcdir: string, dstdir: string) {
    fse.copySync(srcdir, dstdir, { overwrite: true });
  }

  public static getFileContents(filepath: string) {
    return fs.readFileSync(filepath, "utf8");
  }

  public static setFileContents(filepath: string, contents: string) {
    return fs.writeFileSync(filepath, contents);
  }

  public static deleteFile(filepath: string) {
    return fs.unlinkSync(filepath);
  }

  public static getAllFiles(folder: string): Array<string> {
    return fs.readdirSync(folder);
  }

  public static renameFile(
    folder: string,
    currentName: string,
    newName: string
  ) {
    fs.renameSync(folder + currentName, folder + newName);
  }
}
