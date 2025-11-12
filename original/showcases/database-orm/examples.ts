import { getSession, createEntity } from "./HibernateORM.java";

const entity = createEntity({ name: "John", age: 30 });
console.log("Created:", entity.getId());

const session = getSession();
console.log("All entities:", session.findAll().length);
