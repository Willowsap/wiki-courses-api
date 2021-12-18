import UtilService from "./util.service";

export interface FileData {
  title: string;
  contents: string;
}

export interface FullBrokenName {
  fileName: string;
  fileCode: string;
  nextCode: string;
}

const getFullBrokenName = (fileName: string) => {
  return {
    fileName: fileName.slice(4, -4),
    fileCode: fileName.slice(0, 4),
    nextCode: fileName.slice(-4),
  };
};

const orderBrokenNames = (
  startCode: string,
  brokenNames: Array<FullBrokenName>
) => {
  const newNames: Array<FullBrokenName> = [];
  let nextCode = startCode;
  let nodeIndex = -1;
  while (nextCode != LinkedFileList.nullCode) {
    nodeIndex = findNodeIndex(nextCode, brokenNames);
    if (nodeIndex === -1) {
      break;
    } else {
      newNames.push(brokenNames[nodeIndex]);
      nextCode = brokenNames[nodeIndex].nextCode;
      brokenNames.splice(nodeIndex, 1);
    }
  }
  return newNames;
};

const findNodeIndex = (code: string, brokenNames: Array<FullBrokenName>) => {
  for (let i = 0; i < brokenNames.length; i++) {
    if (code === brokenNames[i].fileCode) {
      return i;
    }
  }
  return -1;
};

export class LinkedFileList {
  public static rootCode: string = "1000";
  public static nullCode = "----";

  private folder!: string;
  private root!: FileNode;
  private tail!: FileNode;
  private nextCode: string = "1001";

  constructor({
    folder,
    rootFileName,
    rootFileContents,
  }: {
    folder: string;
    rootFileName: string;
    rootFileContents?: string;
  }) {
    this.folder = folder;
    if (this.folder.slice(-1) !== "/") {
      this.folder += "/";
    }
    if (rootFileContents) {
      this.root = new FileNode({
        folder: this.folder,
        fileName: rootFileName,
        fileCode: LinkedFileList.rootCode,
        fileContents: rootFileContents,
      });
    } else {
      this.root = new FileNode({
        folder: this.folder,
        fileName: rootFileName,
        fileCode: LinkedFileList.rootCode,
      });
    }
    this.tail = this.root;
  }

  public static constructFromFolder(folder: string): LinkedFileList {
    let files = UtilService.getAllFiles(folder);
    let rootFileName: FullBrokenName | null = null;
    const brokenNames: Array<FullBrokenName> = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].startsWith(this.rootCode)) {
        rootFileName = getFullBrokenName(files[i]);
      } else {
        brokenNames.push(getFullBrokenName(files[i]));
      }
    }
    if (!rootFileName) {
      throw new Error("No root file in directory");
    }
    const orderedBrokenNames = orderBrokenNames(
      rootFileName.nextCode,
      brokenNames
    );
    const constructedList = new LinkedFileList({
      folder,
      rootFileName: rootFileName.fileName,
    });
    for (let i = 0; i < orderedBrokenNames.length; i++) {
      constructedList.appendFile({
        fileName: orderedBrokenNames[i].fileName,
        fileCode: orderedBrokenNames[i].fileCode,
      });
    }
    return constructedList;
  }

  appendFile({
    fileName,
    fileContents,
    fileCode,
  }: {
    fileName: string;
    fileContents?: string;
    fileCode?: string;
  }) {
    let newNode;
    if (fileContents && !fileCode) {
      newNode = new FileNode({
        folder: this.folder,
        fileCode: this.nextCode,
        fileName,
        fileContents,
      });
      this.nextCode = (parseInt(this.nextCode) + 1).toString();
    } else if (fileCode && !fileContents) {
      newNode = new FileNode({
        folder: this.folder,
        fileCode,
        fileName,
      });
    } else {
      throw new Error(
        "Must either append a node with a code and no content or content and no code"
      );
    }
    newNode.setPrev(this.tail);
    this.tail.setNext(newNode, fileCode ? false: true);
    this.tail = newNode;
  }

  deleteFile(fileName: string) {
    const nodeToDelete = this.find(fileName);
    if (nodeToDelete) {
      if (nodeToDelete === this.root) {
        throw new Error("Cannot delete root node");
      } else {
        nodeToDelete.deleteFile();
        if (nodeToDelete === this.tail) {
          nodeToDelete.getPrev()?.removeNext();
        } else {
          const nextNode = nodeToDelete.getNext() as FileNode;
          const prevNode = nodeToDelete.getPrev() as FileNode;
          nextNode.setPrev(prevNode);
          prevNode.setNext(nextNode, true);
        }
      }
    }
  }

  getFileFullName(fileName: string): string {
    const fileNode = this.find(fileName);
    if (fileNode) {
      return fileNode.getFullName();
    } else {
      return "";
    }
  }

  getFile(fileName: string): FileData | null {
    const fileNode = this.find(fileName);
    if (fileNode) {
      return { title: fileName, contents: fileNode.getFileContents() };
    } else {
      return null;
    }
  }

  getAllFiles(): Array<FileData> {
    const files: Array<FileData> = [];
    let walker: FileNode | null = this.root;
    while (walker != null) {
      files.push({
        title: walker.getFilename(),
        contents: walker.getFileContents(),
      });
      walker = walker.getNext();
    }
    return files;
  }

  updateFileContents(fileName: string, newContents: string) {
    const fileNode = this.find(fileName);
    if (fileNode) {
      fileNode.setContents(newContents);
    } else {
      console.log("couldnt find file");
      return {message: "could not find file"};
    }
  }

  renameFile(oldFileName: string, newFileName: string) {
    const fileNode = this.find(oldFileName);
    if (fileNode) {
      fileNode.rename(newFileName);
    } else {
      console.log("couldnt find file");
      return {message: "could not find file"};
    }
  }

  private find(fileName: string) {
    let walker: FileNode | null = this.root;
    while (walker != null) {
      if (walker.getFilename() === fileName) {
        return walker;
      }
      walker = walker.getNext();
    }
    return null;
  }
}

class FileNode {
  private fileName: string = "";
  private folder: string = "";
  private code: string = "";
  private nextCode: string = LinkedFileList.nullCode;
  private prev: FileNode | null = null;
  private next: FileNode | null = null;

  constructor({
    folder,
    fileName,
    fileCode,
    fileContents,
  }: {
    folder: string;
    fileName: string;
    fileCode: string;
    fileContents?: string;
  }) {
    this.fileName = fileName;
    this.code = fileCode;
    this.folder = folder;
    if (fileContents) {
      UtilService.setFileContents(folder + this.getFullName(), fileContents);
    }
  }

  setContents(newContents: string) {
    UtilService.setFileContents(this.folder + this.getFullName(), newContents);
  }

  rename(newName: string) {
    UtilService.renameFile(
      this.folder,
      this.getFullName(),
      this.code + newName + this.nextCode
    );
    this.fileName = newName;
  }

  getFullName() {
    return this.code + this.fileName + this.nextCode;
  }

  setNext(nextNode: FileNode | null, rename: boolean) {
    this.next = nextNode;
    const ncode = nextNode ? nextNode.getCode() : LinkedFileList.nullCode;
    if (rename) {
      UtilService.renameFile(
        this.folder,
        this.getFullName(),
        this.code + this.fileName + ncode
      );
    }
    this.nextCode = ncode;
  }

  setPrev(prevNode: FileNode | null) {
    this.prev = prevNode;
  }

  removeNext() {
    this.setNext(null, true);
  }

  removePrev() {
    this.setPrev(null);
  }

  getNext() {
    return this.next;
  }

  getPrev() {
    return this.prev;
  }

  getFilename() {
    return this.fileName;
  }

  getFileContents() {
    return UtilService.getFileContents(this.folder + this.getFullName());
  }

  deleteFile() {
    UtilService.deleteFile(this.folder + this.getFullName());
  }

  getCode() {
    return this.code;
  }

  getNextCode() {
    return this.nextCode;
  }

  setCode(newCode: string) {
    UtilService.renameFile(
      this.folder,
      this.getFullName(),
      newCode + this.fileName + this.nextCode
    );
    this.code = newCode;
    if (this.prev) {
      this.prev.setNext(this, true);
    }
  }
}
