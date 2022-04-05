import request from "supertest";
import {Express} from 'express-serve-static-core';
import app from "../src/app"

let server: Express

describe('App should retrieve javascript course at /api/courses/javascript', () => {
  beforeAll(() => {
    server = app;
  });

  it('should return 200',  (done) => {
    request(server)
      .get('/api/courses/javascript')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)
        expect(res.body).toMatchObject({"title":"javascript","description":"<p>Description for javascript</p>"})
        done()
      })
  });
});