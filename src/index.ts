import sum from "./sum";
const foo = "test";
let bar = 1;
const baz: string = foo;

if (bar === 1) {
  bar = 2;
}

console.warn(foo, bar, baz, sum(2, 5));
