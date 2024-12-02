/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex("tags").del();
  await knex("tags").insert([
    { id: 1, name: "Adventure" },
    { id: 2, name: "Action" },
    { id: 3, name: "Relaxing" },
    { id: 4, name: "Challenging" },
    { id: 5, name: "Dark Fantasy" },
  ]);
}
