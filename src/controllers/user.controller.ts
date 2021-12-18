import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User, { IUser } from "../models/user.model";

export default class UserController {
  private url = "http://wikicourses-env.eba-wnhufmdg.us-east-2.elasticbeanstalk.com/api/user/verify/";
  private spa = "http://wikicoursesapi-env.eba-yaqnxasm.us-east-2.elasticbeanstalk.com/verified";

  sendVerificationEmail = (req: Request, res: Response, next: NextFunction) => {
    User.findOne({ email: req.body.email })
      .then((user: IUser | null) => {
        if (!user) {
          res.status(401).json({
            message: "No such User",
          });
        } else {
          this.sendEmail(user.email, user.uniqueString);
          res.status(200).json({ message: "Message Sent" });
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(404).json({ message: "Failed to send" });
      });
  };

  verifyUser = (req: Request, res: Response, next: NextFunction) => {
    User.findOne({ uniqueString: req.params.uniqueString }).then(
      (user: IUser | null) => {
        if (user) {
          user.verified = true;
          user.save().then(() => {
            res.redirect(this.spa);
          });
        } else {
          res.status(404).json("User not found");
        }
      }
    );
  };

  createUser = (req: Request, res: Response, next: NextFunction) => {
    bcrypt.hash(req.body.password, 10).then((hash) => {
      const user = new User({
        email: req.body.email,
        username: this.genUsername(req.body.email),
        password: hash,
        admin: false,
        verified: false,
        uniqueString: this.randString(),
      });
      user
        .save()
        .then((result) => {
          console.log(result);
          this.sendEmail(user.email, user.uniqueString);
          res.status(201).json({ message: "User Created", result: result });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            message: "Email already registered",
          });
        });
    });
  };

  login = (req: Request, res: Response, next: NextFunction) => {
    let fetchedUser: IUser;
    User.findOne({ email: req.body.email })
      .then((user: IUser | null) => {
        if (!user) {
          res.status(401).json({
            message: "Auth failed",
          });
        } else {
          fetchedUser = user;
          return bcrypt.compare(req.body.password, user.password);
        }
      })
      .then((result) => {
        if (!result) {
          res.status(401).json({
            message: "Auth failed",
          });
        }
        const token = jwt.sign(
          { email: fetchedUser.email, userId: fetchedUser._id },
          "x",
          { expiresIn: "10h" }
        );
        res.status(200).json({
          user: {
            _id: fetchedUser._id,
            email: fetchedUser.email,
            username: fetchedUser.username,
            verified: fetchedUser.verified,
            admin: fetchedUser.admin,
          },
          token: token,
          expiresIn: 36000,
        });
      })
      .catch((err) => {
        res.status(401).json({
          message: "Invalid authentication credentials",
        });
      });
  };

  getUser = (req: Request, res: Response, next: NextFunction) => {
    User.findOne({ _id: req.params._id })
      .then((user) => {
        if (!user) {
          res.status(401).json({
            message: "No such User",
          });
        } else {
          res.status(200).json({
            user: {
              _id: user._id,
              email: user.email,
              username: user.username,
              verified: user.verified,
              admin: user.admin,
            },
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(404).json({ message: "Could not find user" });
      });
  };

  private genUsername = (email: string) => {
    return email.split("@")[0] + Date.now().toString();
  };

  private randString = () => {
    let randStr = "";
    for (let i = 0; i < 8; i++) {
      randStr += Math.floor(Math.random() * 10 + 1);
    }
    return randStr;
  };

  private sendEmail = (email: string, uniqueString: string) => {
    const Transport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "wikisapphirecourses@gmail.com",
        pass: "ozzoqphztnroqzes",
      },
    });
    const sender = "Wiki Courses";
    const mailOptions = {
      from: sender,
      to: email,
      subject: "Account Confirmation",
      html: `press <a href=${this.url}${uniqueString}> here </a> to verify your email. Thanks!`,
    };
    Transport.sendMail(mailOptions, (error, response) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Message sent");
      }
    });
  };
}
