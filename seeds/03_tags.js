/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('tags').del()
  await knex('tags').insert([
    { id: 1, game_id: 1, user_id: 1, name: 'Adventure' },
    { id: 2, game_id: 1, user_id: 1, name: 'Action' },
    { id: 3, game_id: 2, user_id: 2, name: 'Relaxing' },
    { id: 4, game_id: 3, user_id: 3, name: 'Challenging' },
    { id: 5, game_id: 3, user_id: 3, name: 'Dark Fantasy' },
  ]);
};
