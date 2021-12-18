import { Schema, model, Document } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

export interface ICourse extends Document {
  title: string;
  repo: string;
}

export interface ClientCourse {
  title: string;
  description: string;
}

const courseSchema: Schema = new Schema({
  title: { type: String, required: true, unique: true },
  repo: { type: String, required: true, unique: true },
});

courseSchema.plugin(uniqueValidator);

export default model<ICourse>("Course", courseSchema);
