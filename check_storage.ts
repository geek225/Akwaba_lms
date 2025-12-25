
import { storage } from './utils/storage';

console.log("Users:", storage.getUsers().length);
console.log("Courses:", storage.getCourses().length);
console.log("Enrollments:", storage.getEnrollments().length);
const allCourses = storage.getCourses().filter(c => !c.isDraft);
console.log("Non-draft courses:", allCourses.length);
