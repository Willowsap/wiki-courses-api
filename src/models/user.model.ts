import { model, Schema, Document } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  admin: boolean;
  verified: boolean;
  uniqueString: string;
}

const userSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: { type: Boolean, required: true },
  verified: { type: Boolean, required: true },
  uniqueString: { type: String, required: true },
});

userSchema.plugin(uniqueValidator);

export default model<IUser>("User", userSchema);
